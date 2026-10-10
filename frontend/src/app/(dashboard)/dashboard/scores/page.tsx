"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  Award, 
  Search, 
  TrendingUp, 
  BarChart2, 
  CheckCircle2, 
  Calendar, 
  Printer, 
  Share2, 
  Check, 
  RefreshCcw, 
  ExternalLink, 
  Play, 
  Star, 
  FileText, 
  LayoutGrid, 
  List, 
  CalendarCheck,
  Building2,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";

interface ExamScoreItem {
  index: string;
  msv: string;
  fullName: string;
  dob: string;
  className: string;
  subject: string;
  examDate: string;
  testScore: number | null;
  examScore: number | null;
  finalScore: number | null;
  note: string;
  letterGrade: string;
  gpa4: number | null;
  status: "passed" | "failed" | "pending";
  searchKeyword?: string;
}

interface ExamScoreStats {
  totalGraded: number;
  averageFinalScore: number | null;
  averageGpa4: number | null;
  passedCount: number;
  failedCount: number;
  highestScoreSubject: string | null;
}

export default function ExamScoresPage() {
  const { user } = useAuthStore();
  const [msvInput, setMsvInput] = useState("");
  const [savedMsv, setSavedMsv] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [scoreSearch, setScoreSearch] = useState("");
  const [scoreViewMode, setScoreViewMode] = useState<"cards" | "table">("cards");

  const [data, setData] = useState<{
    semester?: string;
    student?: { msv: string; fullName: string; dob?: string; className: string } | null;
    scores?: ExamScoreItem[];
    scoreStats?: ExamScoreStats;
    source?: string;
    examResultNote?: string;
  } | null>(null);

  // Khởi tạo MSV từ bộ nhớ hoặc tài khoản sinh viên
  useEffect(() => {
    let initialMsv = "";
    const local = localStorage.getItem("openquiz_saved_msv");
    if (local) {
      initialMsv = local;
      setSavedMsv(local);
    } else if (user?.student_id) {
      initialMsv = user.student_id;
      setSavedMsv(user.student_id);
    } else if (user?.email?.match(/\d{8,}/)) {
      const match = user.email.match(/\d{8,}/);
      if (match) initialMsv = match[0];
    } else {
      initialMsv = "2823231208"; // Demo sinh viên mẫu
    }

    setMsvInput(initialMsv);
    fetchScores(initialMsv);
  }, [user]);

  const fetchScores = async (code: string, isRefresh = false) => {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);

    const refreshParam = isRefresh ? "&refresh=1" : "";
    try {
      let resData: any = null;
      try {
        const localRes = await fetch(`/api/schedule?msv=${encodeURIComponent(code)}${refreshParam}`);
        const json = await localRes.json();
        if (json.success) {
          resData = json.data;
        } else {
          setError(json.message || "Không tìm thấy dữ liệu điểm thi.");
        }
      } catch (clientErr) {
        // Fallback qua Laravel backend API
        const { data: apiData } = await api.get(`/exam-schedule/lookup?msv=${encodeURIComponent(code)}${refreshParam}`);
        if (apiData.success) {
          resData = apiData.data;
        } else {
          setError(apiData.message || "Không tìm thấy dữ liệu điểm thi.");
        }
      }

      if (resData) {
        setData(resData);
      }
    } catch (err: any) {
      console.error("Lỗi tra cứu điểm thi:", err);
      setError("Không thể tải kết quả thi lúc này. Vui lòng kiểm tra lại kết nối hoặc thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!msvInput.trim()) return;
    fetchScores(msvInput, true);
  };

  const handleSaveDefault = () => {
    if (!msvInput.trim()) return;
    localStorage.setItem("openquiz_saved_msv", msvInput.trim());
    setSavedMsv(msvInput.trim());
    alert(`Đã lưu "${msvInput.trim()}" làm Mã sinh viên mặc định của bạn!`);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Bảng điểm thi ${data?.student?.fullName || msvInput}`,
          text: `Tra cứu điểm thi trắc nghiệm & học phần sinh viên HUBT trên OpenQuiz`,
          url
        });
        return;
      } catch (e) {}
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {}
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredScores = useMemo(() => {
    const list = data?.scores || [];
    if (!scoreSearch.trim()) return list;
    const q = scoreSearch.toLowerCase();
    return list.filter(s =>
      s.subject.toLowerCase().includes(q) ||
      s.note.toLowerCase().includes(q) ||
      s.letterGrade.toLowerCase().includes(q)
    );
  }, [data?.scores, scoreSearch]);

  const getGradeBadge = (letterGrade: string, finalScore: number | null) => {
    if (!letterGrade || finalScore === null) {
      return (
        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-muted text-muted-foreground border border-border">
          Chưa có
        </span>
      );
    }
    if (finalScore >= 8.5) {
      return (
        <span className="px-2.5 py-0.5 rounded-md text-xs font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
          {letterGrade} • Xuất sắc
        </span>
      );
    }
    if (finalScore >= 7.0) {
      return (
        <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-primary/15 text-primary border border-primary/30">
          {letterGrade} • Giỏi/Khá
        </span>
      );
    }
    if (finalScore >= 5.5) {
      return (
        <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
          {letterGrade} • Trung bình
        </span>
      );
    }
    if (finalScore >= 4.0) {
      return (
        <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-500/30">
          {letterGrade} • Đạt
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">
        {letterGrade} • Học lại
      </span>
    );
  };

  const getScoreColor = (score: number | null) => {
    if (score === null || score === undefined) return "text-muted-foreground";
    if (score >= 8.5) return "text-emerald-600 dark:text-emerald-400 font-extrabold";
    if (score >= 7.0) return "text-blue-600 dark:text-blue-400 font-bold";
    if (score >= 5.0) return "text-amber-600 dark:text-amber-400 font-bold";
    return "text-rose-600 dark:text-rose-400 font-bold";
  };

  return (
    <div className="space-y-6 sm:space-y-7 animate-in fade-in duration-300 pb-16">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Bảng điểm thi trắc nghiệm
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                HUBT ITC Live
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Tra cứu điểm điều kiện (KT), điểm thi trắc nghiệm và điểm tổng kết học phần (HP) trực tiếp từ Nhà trường.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Link
            href="/dashboard/schedule"
            className="px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <CalendarCheck className="w-4 h-4 text-primary" />
            <span>Xem Lịch thi</span>
          </Link>

          <button
            onClick={() => fetchScores(msvInput || savedMsv || "2823231208", true)}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50"
            title="Làm mới dữ liệu từ máy chủ trường"
          >
            <RefreshCcw className={cn("w-3.5 h-3.5 text-muted-foreground", loading && "animate-spin")} />
            <span>{loading ? "Đang cập nhật..." : "Làm mới"}</span>
          </button>
        </div>
      </div>

      {/* Tra cứu Form Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-2xs space-y-3">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={msvInput}
              onChange={(e) => setMsvInput(e.target.value)}
              placeholder="Nhập mã sinh viên (ví dụ: 2823231208)..."
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-xs disabled:opacity-50 flex items-center gap-1.5 justify-center flex-1 sm:flex-initial"
            >
              {loading ? (
                <>
                  <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang tra cứu...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Xem điểm</span>
                </>
              )}
            </button>

            {msvInput.trim() && msvInput.trim() !== savedMsv && (
              <button
                type="button"
                onClick={handleSaveDefault}
                title="Lưu MSV này làm mặc định để tự động tải các lần sau"
                className="px-3 py-2.5 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span className="hidden sm:inline">Lưu mặc định</span>
              </button>
            )}
          </div>
        </form>

        {/* Quick Suggestion Pills */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap pt-1">
          <span>Gợi ý tra cứu nhanh:</span>
          {savedMsv && (
            <button
              onClick={() => {
                setMsvInput(savedMsv);
                fetchScores(savedMsv);
              }}
              className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium border border-primary/20 flex items-center gap-1"
            >
              <Star className="w-3 h-3 fill-primary" />
              <span>MSV của bạn: {savedMsv}</span>
            </button>
          )}
          <button
            onClick={() => {
              setMsvInput("2823231208");
              fetchScores("2823231208");
            }}
            className="px-2.5 py-1 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors"
          >
            Demo MSV: 2823231208
          </button>
          <button
            onClick={() => {
              setMsvInput("PM28.04");
              fetchScores("PM28.04");
            }}
            className="px-2.5 py-1 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors"
          >
            Lớp: PM28.04
          </button>
        </div>
      </div>

      {/* Error notification */}
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2.5">
          <Info className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Content Area */}
      {!data?.scores || data.scores.length === 0 ? (
        <div className="p-12 text-center bg-card border border-dashed border-border rounded-2xl shadow-xs space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
            <Award className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-base font-bold text-foreground">Chưa có kết quả điểm thi học kỳ</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Hiện chưa tìm thấy bảng điểm thi trắc nghiệm cho mã sinh viên <span className="font-semibold text-foreground">"{msvInput || savedMsv || 'này'}"</span> trên hệ thống ITC HUBT. Điểm thi trắc nghiệm được cập nhật liên tục sau mỗi ca thi hoàn tất.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
            <button
              onClick={() => fetchScores(msvInput || savedMsv || "2823231208", true)}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-xs flex items-center gap-1.5 hover:bg-primary/90 transition-colors"
            >
              <RefreshCcw className="w-3.5 h-3.5" /> Thử tải lại dữ liệu mới
            </button>
            <button
              onClick={() => {
                setMsvInput("2823231208");
                fetchScores("2823231208");
              }}
              className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors"
            >
              Xem dữ liệu mẫu (MSV 2823231208)
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Student Passport & Semester Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-bold text-foreground">
                    {data.student?.fullName || "Sinh viên HUBT"}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                    {data.student?.msv || msvInput}
                  </span>
                  {data.student?.className && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                      {data.student.className}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                  <span>Kỳ thi: <strong className="text-foreground font-semibold">KẾT QUẢ THI TRẮC NGHIỆM {data.semester || "HỌC KỲ I, NĂM HỌC 2026-2027"}</strong></span>
                  {data.student?.dob && (
                    <>
                      <span>•</span>
                      <span>Ngày sinh: {data.student.dob}</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
              <button
                onClick={handlePrint}
                className="px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                title="In bảng điểm ra giấy hoặc lưu thành file PDF"
              >
                <Printer className="w-3.5 h-3.5 text-muted-foreground" />
                <span>In / Xuất PDF</span>
              </button>

              <button
                onClick={handleShare}
                className="px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                title="Chia sẻ hoặc sao chép liên kết"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Đã chép link</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Chia sẻ</span>
                  </>
                )}
              </button>

              <a
                href="https://itc.hubt.edu.vn/lichthi/"
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <span>Cổng ITC</span>
                <ExternalLink className="w-3 h-3 text-muted-foreground" />
              </a>
            </div>
          </div>

          {/* Bento KPI Summary Statistics Cards */}
          {data.scoreStats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Card 1: Điểm TB Học Phần (Hệ 10) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-2xs relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Điểm TB Học phần (Hệ 10)</span>
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <BarChart2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                    {data.scoreStats.averageFinalScore !== null ? data.scoreStats.averageFinalScore.toFixed(2) : "--"}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Điểm bình quân các môn đã có điểm
                  </p>
                </div>
              </div>

              {/* Card 2: GPA Hệ 4 Quy Đổi */}
              <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-2xs relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">GPA Quy đổi (Hệ 4.0)</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-baseline gap-1">
                    <span>{data.scoreStats.averageGpa4 !== null ? data.scoreStats.averageGpa4.toFixed(2) : "--"}</span>
                    <span className="text-xs font-semibold text-muted-foreground">/ 4.0</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Theo thang điểm tín chỉ ĐH
                  </p>
                </div>
              </div>

              {/* Card 3: Tỷ lệ qua môn */}
              <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-2xs relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Số môn đã đạt (Pass)</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-baseline gap-1">
                    <span className="text-emerald-600 dark:text-emerald-400">{data.scoreStats.passedCount}</span>
                    <span className="text-sm font-semibold text-muted-foreground">/ {data.scoreStats.totalGraded} môn</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {data.scoreStats.failedCount > 0 ? (
                      <span className="text-rose-500 font-semibold">{data.scoreStats.failedCount} môn chưa đạt</span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">100% môn đạt chuẩn</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Card 4: Môn điểm cao nhất */}
              <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 shadow-2xs relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Môn đạt điểm cao nhất</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-base sm:text-lg font-bold text-foreground line-clamp-1" title={data.scoreStats.highestScoreSubject || ""}>
                    {data.scoreStats.highestScoreSubject || "Chưa có"}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Thành tích học phần xuất sắc
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Toolbar: Search & Switch View (Bento Grid vs Official Table) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={scoreSearch}
                onChange={(e) => setScoreSearch(e.target.value)}
                placeholder="Tìm tên môn học, xếp loại (A, B+...), ghi chú..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-card border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:border-primary"
              />
              {scoreSearch && (
                <button
                  onClick={() => setScoreSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Xóa
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <span className="text-xs text-muted-foreground mr-1 hidden sm:inline">Chế độ xem:</span>
              <div className="p-1 rounded-xl bg-muted border border-border/60 flex items-center gap-1">
                <button
                  onClick={() => setScoreViewMode("cards")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all",
                    scoreViewMode === "cards"
                      ? "bg-card text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Thẻ Bento</span>
                </button>
                <button
                  onClick={() => setScoreViewMode("table")}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all",
                    scoreViewMode === "table"
                      ? "bg-card text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Bảng chi tiết</span>
                </button>
              </div>
            </div>
          </div>

          {/* VIEW 1: BENTO CARDS VIEW */}
          {scoreViewMode === "cards" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredScores.map((score, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-card border border-border/80 shadow-2xs hover:shadow-sm hover:border-primary/40 transition-all flex flex-col justify-between space-y-4 group"
                >
                  {/* Top: Index, Subject, Grade Badge */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-muted text-muted-foreground">
                        #{score.index || idx + 1}
                      </span>
                      <div>{getGradeBadge(score.letterGrade, score.finalScore)}</div>
                    </div>

                    <h3 className="text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                      {score.subject}
                    </h3>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Ngày thi: {score.examDate || "Đang cập nhật"}</span>
                      </span>
                      {score.note && (
                        <span className="px-1.5 py-0.2 rounded bg-muted text-muted-foreground text-[10px] font-medium">
                          {score.note}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle: 3 Score Pillars (KT, Thi, HP) */}
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-muted/40 border border-border/50 text-center">
                    {/* Cột 1: Điểm KT */}
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                        Điểm KT
                      </span>
                      <span className={cn("text-base font-bold", getScoreColor(score.testScore))}>
                        {score.testScore !== null ? score.testScore : "--"}
                      </span>
                    </div>

                    {/* Cột 2: Điểm Thi trắc nghiệm */}
                    <div className="space-y-0.5 border-x border-border/60 px-1">
                      <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                        Điểm Thi
                      </span>
                      <span className={cn("text-lg font-black", getScoreColor(score.examScore))}>
                        {score.examScore !== null ? score.examScore : "--"}
                      </span>
                    </div>

                    {/* Cột 3: Điểm HP (Tổng kết) */}
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                        Điểm HP
                      </span>
                      <span className={cn("text-lg font-black", getScoreColor(score.finalScore))}>
                        {score.finalScore !== null ? score.finalScore : "--"}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Action: Practice Quizzes for this subject */}
                  <div className="pt-1 flex items-center justify-between gap-2 border-t border-border/40">
                    <span className="text-[11px] text-muted-foreground">
                      Quy đổi: <strong className="text-foreground">{score.gpa4 !== null ? `${score.gpa4.toFixed(1)} (hệ 4)` : "--"}</strong>
                    </span>

                    <Link
                      href={`/dashboard/quizzes?search=${encodeURIComponent(score.searchKeyword || score.subject)}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors"
                    >
                      <Play className="w-3 h-3 fill-primary" />
                      <span>Luyện đề môn này</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* VIEW 2: FORMAL TABLE VIEW (Khớp chuẩn 100% form ITC HUBT) */}
          {scoreViewMode === "table" && (
            <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-foreground">
                  <thead className="bg-muted/70 text-muted-foreground uppercase font-semibold text-[11px] tracking-wider border-b border-border">
                    <tr>
                      <th className="py-3 px-3 text-center w-12">TT</th>
                      <th className="py-3 px-3">Mã SV</th>
                      <th className="py-3 px-4">Họ và Tên</th>
                      <th className="py-3 px-3 text-center">Ngày sinh</th>
                      <th className="py-3 px-3 text-center">Lớp</th>
                      <th className="py-3 px-4 min-w-[180px]">Môn thi</th>
                      <th className="py-3 px-3 text-center">Ngày thi</th>
                      <th className="py-3 px-3 text-center bg-muted/90 font-bold">Điểm KT</th>
                      <th className="py-3 px-3 text-center bg-primary/10 text-primary font-bold">Điểm Thi</th>
                      <th className="py-3 px-3 text-center bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-extrabold">Điểm HP</th>
                      <th className="py-3 px-3 text-center">Xếp loại</th>
                      <th className="py-3 px-3 text-center">Ghi chú</th>
                      <th className="py-3 px-3 text-center">Ôn thi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredScores.map((score, index) => (
                      <tr key={index} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3.5 px-3 text-center font-medium text-muted-foreground">
                          {score.index || index + 1}
                        </td>
                        <td className="py-3.5 px-3 font-mono font-medium text-foreground">
                          {score.msv || data.student?.msv || "--"}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-foreground whitespace-nowrap">
                          {score.fullName || data.student?.fullName || "--"}
                        </td>
                        <td className="py-3.5 px-3 text-center text-muted-foreground whitespace-nowrap">
                          {score.dob || data.student?.dob || "--"}
                        </td>
                        <td className="py-3.5 px-3 text-center font-medium text-muted-foreground whitespace-nowrap">
                          {score.className || data.student?.className || "--"}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-foreground">
                          {score.subject}
                        </td>
                        <td className="py-3.5 px-3 text-center text-muted-foreground whitespace-nowrap">
                          {score.examDate || "--"}
                        </td>
                        <td className={cn("py-3.5 px-3 text-center font-bold text-sm bg-muted/40", getScoreColor(score.testScore))}>
                          {score.testScore !== null ? score.testScore : "--"}
                        </td>
                        <td className={cn("py-3.5 px-3 text-center font-black text-sm bg-primary/5", getScoreColor(score.examScore))}>
                          {score.examScore !== null ? score.examScore : "--"}
                        </td>
                        <td className={cn("py-3.5 px-3 text-center font-black text-base bg-emerald-500/5", getScoreColor(score.finalScore))}>
                          {score.finalScore !== null ? score.finalScore : "--"}
                        </td>
                        <td className="py-3.5 px-3 text-center whitespace-nowrap">
                          {getGradeBadge(score.letterGrade, score.finalScore)}
                        </td>
                        <td className="py-3.5 px-3 text-center text-muted-foreground font-mono text-[11px]">
                          {score.note || "--"}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <Link
                            href={`/dashboard/quizzes?search=${encodeURIComponent(score.searchKeyword || score.subject)}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-semibold transition-colors whitespace-nowrap"
                            title={`Luyện đề trắc nghiệm môn ${score.subject}`}
                          >
                            <Play className="w-3 h-3 fill-primary" />
                            <span>Luyện đề</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Informative Footer & Quy chế đào tạo tín chỉ */}
          <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground">Quy chế tính điểm học phần (ĐH Kinh doanh và Công nghệ Hà Nội)</h4>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Điểm học phần (Điểm HP) = Điểm điều kiện (Điểm KT) x Trọng số + Điểm thi trắc nghiệm (Điểm Thi) x Trọng số. Thang điểm chữ: A (4.0), B+ (3.5), B (3.0), C+ (2.5), C (2.0), D+ (1.5), D (1.0), F (0.0). Điểm HP &ge; 4.0 là đạt môn.
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/quizzes"
              className="px-3.5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold transition-colors self-start sm:self-auto shrink-0 shadow-2xs"
            >
              Kho đề ôn thi trắc nghiệm
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
