import { NextRequest, NextResponse } from "next/server";

// Cache in-memory for 5 minutes to reduce load on the school portal
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_ENTRIES = 200;

function pruneCache() {
  const now = Date.now();
  for (const [key, val] of cache.entries()) {
    if (now - val.timestamp >= CACHE_TTL_MS || cache.size > MAX_CACHE_ENTRIES) {
      cache.delete(key);
    }
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const msv = searchParams.get("msv")?.trim();

  // Validate length and pattern to prevent memory exhaustion or unexpected input
  if (!msv || msv.length > 30 || !/^[a-zA-Z0-9\s._-]+$/.test(msv)) {
    return NextResponse.json(
      { success: false, message: "Mã sinh viên hoặc tên lớp không hợp lệ (tối đa 30 ký tự)." },
      { status: 400 }
    );
  }

  // Check cache
  const cacheKey = msv.toUpperCase();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cached.data);
  }

  if (cache.size >= MAX_CACHE_ENTRIES) {
    pruneCache();
  }

  try {
    const targetUrl = `https://itc.hubt.edu.vn/tra-cuu/lich-thi?msv=${encodeURIComponent(msv)}`;
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 300 } // Next.js fetch cache 5 mins
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: `Không thể kết nối đến cổng tra cứu ITC HUBT (Mã lỗi ${response.status}).` },
        { status: 502 }
      );
    }

    const html = await response.text();

    // 1. Kiểm tra bảng lịch thi
    const tableMatch = html.match(/<table[^>]*>([\s\S]*?)<\/table>/i);
    if (!tableMatch) {
      const msgMatch = html.match(/<p[^>]*class="[^"]*text-slate-500[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
      return NextResponse.json({
        success: false,
        message: msgMatch ? msgMatch[1].replace(/<[^>]+>/g, "").trim() : "Chưa có lịch thi chi tiết cho thông tin tìm kiếm này hoặc không tìm thấy sinh viên."
      });
    }

    // 2. Lấy thông tin học kỳ
    const semesterMatch = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
    const semester = semesterMatch ? semesterMatch[1].replace(/<[^>]+>/g, "").trim().replace(/\s+/g, " ") : "LỊCH THI HỌC KỲ";

    // 3. Phân tích các hàng trong bảng
    const tableContent = tableMatch[1];
    const tbodyMatch = tableContent.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
    const rowsContent = tbodyMatch ? tbodyMatch[1] : tableContent;

    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let rowMatch;
    const schedules = [];
    let studentInfo: { msv: string; fullName: string; dob: string; className: string } | null = null;

    const now = new Date();

    while ((rowMatch = rowRegex.exec(rowsContent)) !== null) {
      const rowHtml = rowMatch[1];
      const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      let tdMatch;
      const cells: string[] = [];
      while ((tdMatch = tdRegex.exec(rowHtml)) !== null) {
        cells.push(tdMatch[1].replace(/<[^>]+>/g, "").trim());
      }

      if (cells.length >= 10) {
        const itemDateStr = cells[8] || ""; // e.g. 01/10/2026
        const itemTimeStr = cells[9] || ""; // e.g. 10h30

        // Parse date for countdown
        let examDateTime: Date | null = null;
        let countdownText = "";
        let status: "upcoming" | "today" | "passed" = "upcoming";

        if (itemDateStr) {
          const parts = itemDateStr.split("/");
          if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2], 10);

            let hours = 8;
            let minutes = 0;
            if (itemTimeStr) {
              const timeParts = itemTimeStr.toLowerCase().split("h");
              hours = parseInt(timeParts[0], 10) || 8;
              minutes = parseInt(timeParts[1], 10) || 0;
            }

            examDateTime = new Date(year, month, day, hours, minutes);

            // Compare with now
            const diffMs = examDateTime.getTime() - now.getTime();
            const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

            if (diffMs < -1000 * 60 * 60 * 4) { // 4 hours after exam
              status = "passed";
              countdownText = "Đã thi xong";
            } else if (Math.abs(diffDays) === 0 || (diffMs >= 0 && diffMs <= 1000 * 60 * 60 * 24)) {
              status = "today";
              countdownText = "Hôm nay thi!";
            } else if (diffDays === 1) {
              status = "upcoming";
              countdownText = "Ngày mai thi";
            } else if (diffDays > 1) {
              status = "upcoming";
              countdownText = `Còn ${diffDays} ngày`;
            } else {
              status = "passed";
              countdownText = "Đã qua";
            }
          }
        }

        const fullName = `${cells[2] || ""} ${cells[3] || ""}`.trim();
        const subject = cells[6] || "";

        // Keyword to match with OpenQuiz quizzes
        let searchKeyword = "";
        const lowerSubject = subject.toLowerCase();
        if (lowerSubject.includes("java")) searchKeyword = "java";
        else if (lowerSubject.includes("đám mây") || lowerSubject.includes("đtdm")) searchKeyword = "đám mây";
        else if (lowerSubject.includes("mạng") || lowerSubject.includes("qtm")) searchKeyword = "mạng";
        else if (lowerSubject.includes("cơ sở dữ liệu") || lowerSubject.includes("csdl")) searchKeyword = "csdl";
        else if (lowerSubject.includes("web")) searchKeyword = "web";
        else if (lowerSubject.includes("python")) searchKeyword = "python";
        else if (lowerSubject.includes("hệ điều hành")) searchKeyword = "hệ điều hành";
        else searchKeyword = subject.split(" ")[0] || "";

        const item = {
          index: cells[0] || String(schedules.length + 1),
          msv: cells[1] || "",
          lastName: cells[2] || "",
          firstName: cells[3] || "",
          fullName: fullName,
          dob: cells[4] || "",
          className: cells[5] || "",
          subject: subject,
          room: cells[7] || "",
          date: itemDateStr,
          time: itemTimeStr,
          testScore: cells[10] ? parseFloat(cells[10].replace(",", ".")) : null,
          note: cells[11] || "",
          status,
          countdownText,
          searchKeyword
        };

        if (!studentInfo && item.msv) {
          studentInfo = {
            msv: item.msv,
            fullName: item.fullName,
            dob: item.dob,
            className: item.className
          };
        }

        schedules.push(item);
      }
    }

    // 4. Lấy thông báo kết quả thi trắc nghiệm nếu có
    let examResultNote = "Chưa có kết quả thi trắc nghiệm.";
    const resultNoteMatches = html.match(/<p[^>]*class="[^"]*text-slate-500[^"]*"[^>]*>([\s\S]*?)<\/p>/gi);
    if (resultNoteMatches && resultNoteMatches.length > 0) {
      const lastMatch = resultNoteMatches[resultNoteMatches.length - 1];
      examResultNote = lastMatch.replace(/<[^>]+>/g, "").trim();
    }

    const payload = {
      success: true,
      data: {
        semester,
        student: studentInfo,
        schedules,
        examResultNote,
        totalSubjects: schedules.length,
        source: "HUBT ITC (Trung tâm Tin học ứng dụng)"
      }
    };

    // Cache the response
    cache.set(cacheKey, { data: payload, timestamp: Date.now() });

    return NextResponse.json(payload);
  } catch (error: any) {
    console.error("Error scraping HUBT schedule:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Lỗi kết nối khi tra cứu lịch thi từ hệ thống ITC HUBT. Vui lòng thử lại sau.",
        error: error.message
      },
      { status: 500 }
    );
  }
}
