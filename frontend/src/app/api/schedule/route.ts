import { NextRequest, NextResponse } from "next/server";

// Cache in-memory
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 200;

function pruneCache() {
  const now = Date.now();
  for (const [key, val] of cache.entries()) {
    if (now - val.timestamp >= val.ttl || cache.size > MAX_CACHE_ENTRIES) {
      cache.delete(key);
    }
  }
}

function stripHtml(h: string): string {
  return (h || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Chuẩn hóa tên môn học để gộp trùng lặp (không phân biệt hoa thường, dấu tiếng Việt, ký tự lạ)
 */
function normalizeSubjectKey(name: string): string {
  return (name || "")
    .toLowerCase()
    .replace(/[đĐ]/g, "d")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

function guessSearchKeyword(subject: string): string {
  const s = subject.toLowerCase();
  if (s.includes("java")) return "java";
  if (s.includes("đám mây") || s.includes("dtdm") || s.includes("điện toán")) return "đám mây";
  if (s.includes("mã nguồn mở") || s.includes("open source")) return "mã nguồn mở";
  if (s.includes("mạng") || s.includes("qtm")) return "mạng";
  if (s.includes("cơ sở dữ liệu") || s.includes("csdl")) return "cơ sở dữ liệu";
  if (s.includes("web")) return "web";
  if (s.includes("python")) return "python";
  if (s.includes("hệ điều hành")) return "hệ điều hành";
  if (s.includes("lập trình")) return "lập trình";
  if (s.includes("thuật toán")) return "thuật toán";
  return subject.split(" ")[0] || "";
}

/**
 * Phân tích dữ liệu từ cổng Khoa CNTT (fit.hubt.edu.vn)
 */
function parseHubtFitHtml(html: string, msv: string) {
  // 1. Lấy thông tin sinh viên từ .hubt-student-info
  let fullName = "";
  let className = "";

  const nameMatch = html.match(
    /class="hubt-info-value"[^>]*>([^<]+)<\/[^>]+>[\s\S]*?class="hubt-info-value"[^>]*>([^<]+)<\/[^>]+>[\s\S]*?class="hubt-info-value"[^>]*>([^<]+)<\/[^>]+>/i
  );
  if (nameMatch) {
    fullName = nameMatch[1].trim();
    className = nameMatch[3].trim();
  } else {
    const fnMatch = html.match(/(?:Họ và tên|HỌ VÀ TÊN)[^>]*>[\s\S]*?<span[^>]*class="hubt-info-value"[^>]*>([^<]+)<\/span>/i);
    if (fnMatch) fullName = fnMatch[1].trim();
    const clMatch = html.match(/(?:Lớp|LỚP)[^>]*>[\s\S]*?<span[^>]*class="hubt-info-value"[^>]*>([^<]+)<\/span>/i);
    if (clMatch) className = clMatch[1].trim();
  }

  // 2. Học kỳ
  let semesterText = "LỊCH THI HỌC KỲ I - NĂM HỌC 2026-2027";
  const semMatch = html.match(/Học kỳ\s*\d+[^<"]*/i);
  if (semMatch) semesterText = semMatch[0].trim();

  // 3. Phân tích bảng ca thi
  const schedules: any[] = [];
  const tbodyMatch = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
  const rowsHtml = tbodyMatch ? tbodyMatch[1] : html;
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;

  const now = new Date();

  while ((rowMatch = rowRegex.exec(rowsHtml)) !== null) {
    const rHtml = rowMatch[1];
    const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    let tdMatch;
    const rawCells: string[] = [];

    while ((tdMatch = tdRegex.exec(rHtml)) !== null) {
      rawCells.push(tdMatch[1]);
    }

    // Các cột FIT: [0] Đợt công bố, [1] Môn học, [2] Điểm số, [3] Lịch thi (Ngày/Giờ), [4] Phòng, [5] Thời gian
    if (rawCells.length >= 4) {
      const dotCongBo = stripHtml(rawCells[0]);
      const subject = stripHtml(rawCells[1]);
      const scoreStr = stripHtml(rawCells[2]);
      const cell3Raw = rawCells[3];
      const room = stripHtml(rawCells[4] || "");
      const durationRaw = stripHtml(rawCells[5] || "");
      const duration = durationRaw.replace(/&#039;/g, "'").replace(/&quot;/g, '"');

      // Tách ngày và giờ bằng regex chuẩn
      const dateMatch = cell3Raw.match(/(\d{2}\/\d{2}\/\d{4})/);
      const timeMatch = cell3Raw.match(/(\d{1,2}[:h]\d{2})/i);
      const dateStr = dateMatch ? dateMatch[1] : "";
      const timeStr = timeMatch ? timeMatch[1].replace(":", "h") : "";

      // Phân tích trạng thái và đếm ngược
      let status: "upcoming" | "today" | "passed" = "upcoming";
      let countdownText = "";
      const badgeMatch = cell3Raw.match(/class="status-badge[^"]*"[^>]*>([^<]+)<\/span>/i);
      if (badgeMatch) {
        countdownText = badgeMatch[1].trim();
        if (cell3Raw.includes("status-past") || countdownText.includes("Đã thi")) {
          status = "passed";
        } else if (cell3Raw.includes("status-today") || countdownText.includes("Hôm nay")) {
          status = "today";
        } else {
          status = "upcoming";
        }
      }

      // Nếu không có badge từ HTML, tự tính toán
      if (!countdownText && dateStr) {
        const parts = dateStr.split("/");
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = parseInt(parts[2], 10);
          let hours = 8, minutes = 0;
          if (timeStr) {
            const [h, m] = timeStr.toLowerCase().replace("h", ":").split(":");
            hours = parseInt(h, 10) || 8;
            minutes = parseInt(m, 10) || 0;
          }
          const examDt = new Date(year, month, day, hours, minutes);
          const diffMs = examDt.getTime() - now.getTime();
          const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

          if (diffMs < -1000 * 60 * 60 * 4) {
            status = "passed";
            countdownText = "Đã thi xong";
          } else if (diffDays <= 0 || (diffMs >= 0 && diffMs <= 1000 * 60 * 60 * 24)) {
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

      const score = scoreStr ? parseFloat(scoreStr.replace(",", ".")) : null;

      if (subject) {
        schedules.push({
          index: String(schedules.length + 1),
          msv: msv,
          lastName: "",
          firstName: fullName,
          fullName: fullName,
          dob: "",
          className: className,
          subject,
          room,
          date: dateStr,
          time: timeStr,
          duration,
          testScore: isNaN(score as number) ? null : score,
          note: dotCongBo,
          status,
          countdownText,
          searchKeyword: guessSearchKeyword(subject),
        });
      }
    }
  }

  // 4. Lưu ý từ Khoa CNTT
  let warningNote = "";
  const warningListMatch = html.match(/<ul[^>]*class="hubt-warning-list"[^>]*>([\s\S]*?)<\/ul>/i);
  if (warningListMatch) {
    const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    let liMatch;
    const notes: string[] = [];
    while ((liMatch = liRegex.exec(warningListMatch[1])) !== null) {
      notes.push(stripHtml(liMatch[1]));
    }
    warningNote = notes.join(" • ");
  }

  return {
    semester: semesterText,
    student: fullName ? { msv, fullName, dob: "", className } : null,
    schedules,
    examResultNote: warningNote || "Lưu ý: Có mặt trước giờ thi 15 phút, mang theo Thẻ sinh viên hoặc CCCD.",
    totalSubjects: schedules.length,
    source: "Khoa CNTT - HUBT (fit.hubt.edu.vn)",
  };
}

/**
 * Tra cứu từ cổng Khoa CNTT (fit.hubt.edu.vn) kèm cơ chế tự động thử lại (Retry) & Timeout chịu trễ mạng
 */
async function fetchFromHubtFit(msv: string) {
  const maxAttempts = 2;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const fitRes = await fetch("https://fit.hubt.edu.vn/wp-json/hubt/v1/lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json, text/plain, */*",
          "Origin": "https://fit.hubt.edu.vn",
          "Referer": "https://fit.hubt.edu.vn/lichthi/",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        },
        body: JSON.stringify({ mssv: msv }),
        signal: AbortSignal.timeout(12000), // 12 giây chịu độ trễ mạng trường
      });

      if (!fitRes.ok) {
        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 600));
          continue;
        }
        return null;
      }

      const json = await fitRes.json();
      const htmlContent: string = json.html || json.data || json.content || "";

      if (htmlContent && !htmlContent.includes("hubt-error") && htmlContent.length > 100) {
        const parsed = parseHubtFitHtml(htmlContent, msv);
        if (parsed.schedules.length > 0) {
          return parsed;
        }
      }
    } catch (err) {
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 600));
        continue;
      }
    }
  }
  return null;
}

/**
 * Fallback / Dự phòng: Tra cứu từ cổng ITC (itc.hubt.edu.vn) cho sinh viên các khoa khác hoặc lớp
 */
async function fetchFromHubtItc(code: string) {
  try {
    const targetUrl = `https://itc.hubt.edu.vn/tra-cuu/lich-thi?msv=${encodeURIComponent(code)}`;
    const response = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) return null;
    const html = await response.text();

    const tableMatch = html.match(/<table[^>]*>([\s\S]*?)<\/table>/i);
    if (!tableMatch) return null;

    const semesterMatch = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
    const semester = semesterMatch ? semesterMatch[1].replace(/<[^>]+>/g, "").trim().replace(/\s+/g, " ") : "LỊCH THI HỌC KỲ";

    const tableContent = tableMatch[1];
    const tbodyMatch = tableContent.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
    const rowsContent = tbodyMatch ? tbodyMatch[1] : tableContent;

    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let rowMatch;
    const schedules: any[] = [];
    let studentInfo: any = null;
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
        const itemDateStr = cells[8] || "";
        const itemTimeStr = cells[9] || "";
        let status: "upcoming" | "today" | "passed" = "upcoming";
        let countdownText = "";

        if (itemDateStr) {
          const parts = itemDateStr.split("/");
          if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2], 10);
            let hours = 8, minutes = 0;
            if (itemTimeStr) {
              const timeParts = itemTimeStr.toLowerCase().split("h");
              hours = parseInt(timeParts[0], 10) || 8;
              minutes = parseInt(timeParts[1], 10) || 0;
            }
            const examDateTime = new Date(year, month, day, hours, minutes);
            const diffMs = examDateTime.getTime() - now.getTime();
            const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

            if (diffMs < -1000 * 60 * 60 * 4) {
              status = "passed";
              countdownText = "Đã thi xong";
            } else if (diffDays <= 0 || (diffMs >= 0 && diffMs <= 1000 * 60 * 60 * 24)) {
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
          searchKeyword: guessSearchKeyword(subject),
        };

        if (!studentInfo && item.msv) {
          studentInfo = {
            msv: item.msv,
            fullName: item.fullName,
            dob: item.dob,
            className: item.className,
          };
        }

        schedules.push(item);
      }
    }

    let examResultNote = "Chưa có kết quả thi trắc nghiệm.";
    const resultNoteMatches = html.match(/<p[^>]*class="[^"]*text-slate-500[^"]*"[^>]*>([\s\S]*?)<\/p>/gi);
    if (resultNoteMatches && resultNoteMatches.length > 0) {
      examResultNote = resultNoteMatches[resultNoteMatches.length - 1].replace(/<[^>]+>/g, "").trim();
    }

    return {
      semester,
      student: studentInfo,
      schedules,
      examResultNote,
      totalSubjects: schedules.length,
      source: "HUBT ITC (Trung tâm Tin học ứng dụng)",
    };
  } catch {
    return null;
  }
}

/**
 * Gộp dữ liệu từ FIT và ITC để đảm bảo không bao giờ bị sót môn học
 */
function mergeScheduleSources(fitData: any, itcData: any) {
  if (!fitData && !itcData) return null;
  if (fitData && !itcData) return fitData;
  if (!fitData && itcData) return itcData;

  // Cả hai nguồn đều có dữ liệu: Lấy FIT làm dữ liệu gốc chính xác nhất
  const mergedSchedules = [...fitData.schedules];
  const existingKeys = new Set(
    mergedSchedules.map((s: any) => normalizeSubjectKey(s.subject))
  );

  // Nếu ITC có môn nào mà FIT chưa có (ví dụ môn chung, môn chưa đồng bộ) -> tự động ghép thêm
  for (const itcItem of itcData.schedules) {
    const key = normalizeSubjectKey(itcItem.subject);
    if (!existingKeys.has(key)) {
      existingKeys.add(key);
      mergedSchedules.push({
        ...itcItem,
        index: String(mergedSchedules.length + 1)
      });
    }
  }

  return {
    ...fitData,
    schedules: mergedSchedules,
    totalSubjects: mergedSchedules.length,
    source: "Khoa CNTT - HUBT (fit.hubt.edu.vn)",
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const msv = searchParams.get("msv")?.trim();
  const isForceRefresh = searchParams.get("refresh") === "1" || searchParams.get("fresh") === "1";

  if (!msv || msv.length > 30 || !/^[a-zA-Z0-9\s._-]+$/.test(msv)) {
    return NextResponse.json(
      { success: false, message: "Mã sinh viên hoặc mã lớp không hợp lệ (tối đa 30 ký tự)." },
      { status: 400 }
    );
  }

  const cacheKey = msv.toUpperCase();
  const cached = cache.get(cacheKey);

  // Trả về cache nếu chưa hết hạn và người dùng không yêu cầu refresh
  if (!isForceRefresh && cached && Date.now() - cached.timestamp < cached.ttl) {
    return NextResponse.json(cached.data);
  }

  if (cache.size >= MAX_CACHE_ENTRIES) pruneCache();

  try {
    // Chạy song song cả cổng FIT và ITC để tối ưu tốc độ và không bao giờ sót môn
    const [fitResult, itcResult] = await Promise.allSettled([
      fetchFromHubtFit(msv),
      fetchFromHubtItc(msv)
    ]);

    const fitData = fitResult.status === "fulfilled" ? fitResult.value : null;
    const itcData = itcResult.status === "fulfilled" ? itcResult.value : null;

    const finalData = mergeScheduleSources(fitData, itcData);

    if (finalData && finalData.schedules.length > 0) {
      const payload = {
        success: true,
        data: finalData,
      };

      // Nếu có dữ liệu từ Khoa CNTT (FIT): Cache 5 phút. Nếu chỉ có ITC (fallback): Cache ngắn 30s để nhanh chóng thử lại FIT
      const ttl = fitData ? CACHE_TTL_MS : 30 * 1000;
      cache.set(cacheKey, { data: payload, timestamp: Date.now(), ttl });
      return NextResponse.json(payload);
    }

    return NextResponse.json({
      success: false,
      message: "Không tìm thấy thông tin lịch thi cho mã sinh viên hoặc lớp này. Vui lòng kiểm tra lại.",
    });

  } catch (error: any) {
    console.error("Lỗi khi tra cứu lịch thi:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Lỗi kết nối khi tra cứu lịch thi HUBT. Vui lòng thử lại sau.",
      },
      { status: 500 }
    );
  }
}
