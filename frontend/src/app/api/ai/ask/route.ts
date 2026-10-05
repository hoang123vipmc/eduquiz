import { NextRequest, NextResponse } from "next/server";

// In-memory rate limiting: 12 requests per minute per IP
const ipRateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 12;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipRateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    ipRateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  entry.count++;
  return true;
}

// Cleanup rate limit map every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of ipRateLimitMap.entries()) {
    if (now > entry.resetAt) {
      ipRateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent";

export async function POST(request: NextRequest) {
  // 1. Rate Limiting Check
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { success: false, message: "Bạn đã gửi quá nhiều yêu cầu hỏi AI. Vui lòng chờ 1 phút rồi thử lại." },
      { status: 429 }
    );
  }

  // 2. Secret Key from Server Environment
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, message: "Hệ thống chưa cấu hình Gemini API Key trên máy chủ." },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { mode, questionText, options, correctOptionText, selectedOptionText, quizTitle } = body;

    // 3. Input Validation
    if (!questionText || typeof questionText !== "string" || questionText.length > 5000) {
      return NextResponse.json(
        { success: false, message: "Nội dung câu hỏi không hợp lệ hoặc quá dài." },
        { status: 400 }
      );
    }

    if (!Array.isArray(options) || options.length > 20) {
      return NextResponse.json(
        { success: false, message: "Danh sách lựa chọn không hợp lệ." },
        { status: 400 }
      );
    }

    const aiMode = mode === "debate" ? "debate" : "explain";

    // 4. Build Prompt
    const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const optsList = options
      .map((opt: any, i: number) => {
        const isCorrect =
          opt.is_correct === 1 ||
          opt.is_correct === true ||
          String(opt.is_correct) === "1" ||
          String(opt.is_correct) === "true";
        const label = letters[i] || `${i + 1}`;
        const optText = String(opt.option_text || opt.text || "").slice(0, 500);
        return `${label}. ${optText}${isCorrect ? " ✓ (đáp án theo đề)" : ""}`;
      })
      .join("\n");

    const ctx = [
      `Đề thi: ${String(quizTitle || "Câu hỏi trắc nghiệm").slice(0, 200)}`,
      `Câu hỏi: ${questionText}`,
      `Các lựa chọn:\n${optsList}`,
      correctOptionText ? `Đáp án theo đề: ${String(correctOptionText).slice(0, 500)}` : "",
      selectedOptionText ? `Học sinh chọn: ${String(selectedOptionText).slice(0, 500)}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    let prompt = "";
    if (aiMode === "explain") {
      prompt = `${ctx}

Hãy giải thích CHI TIẾT bằng tiếng Việt:
1. **Đáp án đúng** là gì và tại sao?
2. **Tại sao** các đáp án khác sai?
3. **Kiến thức cần nhớ** liên quan?

Trả lời ngắn gọn, dùng markdown.`;
    } else {
      prompt = `${ctx}

Hãy PHÂN TÍCH KHÁCH QUAN với vai trò chuyên gia:
1. **Đáp án theo đề** có chính xác không? Tại sao?
2. **Nếu đáp án có thể sai**, chỉ ra điểm bất hợp lý và đề xuất đáp án đúng hơn.
3. **Kết luận** đáp án nào chính xác nhất theo kiến thức thực tế?

Trả lời khách quan, có dẫn chứng, bằng tiếng Việt, dùng markdown.`;
    }

    // 5. Call Gemini API securely from server
    const geminiRes = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1200,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errJson = await geminiRes.json().catch(() => ({}));
      const errMsg = errJson?.error?.message || `Lỗi từ Gemini API (mã ${geminiRes.status})`;
      return NextResponse.json({ success: false, message: errMsg }, { status: 502 });
    }

    const data = await geminiRes.json();
    const answerText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!answerText) {
      return NextResponse.json(
        { success: false, message: "AI không trả về nội dung phản hồi." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        text: answerText,
      },
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi xử lý yêu cầu AI." },
      { status: 500 }
    );
  }
}
