"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  CalendarCheck, 
  Search, 
  Clock, 
  GraduationCap, 
  User, 
  Building2, 
  Award, 
  AlertCircle, 
  BookOpen, 
  CheckCircle2, 
  Sparkles, 
  RefreshCcw, 
  ExternalLink, 
  Plus, 
  Trash2, 
  Calendar, 
  MapPin, 
  Star,
  FileCheck2,
  Share2,
  Check,
  Info,
  Play,
  Copy,
  Printer,
  TrendingUp,
  BarChart2,
  FileText,
  LayoutGrid,
  List
} from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";

interface ScheduleItem {
  index: string;
  msv: string;
  lastName: string;
  firstName: string;
  fullName: string;
  dob: string;
  className: string;
  subject: string;
  room: string;
  date: string;
  time: string;
  duration?: string;
  testScore: number | null;
  note: string;
  status: "upcoming" | "today" | "passed";
  countdownText: string;
  searchKeyword: string;
}

export interface ExamScoreItem {
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
  searchKeyword: string;
}

export interface ExamScoreStats {
  totalGraded: number;
  averageFinalScore: number | null;
  averageGpa4: number | null;
  passedCount: number;
  failedCount: number;
  highestScoreSubject: string | null;
}

interface CustomSchedule {
  id: string;
  subject: string;
  date: string;
  time: string;
  room: string;
  note: string;
}

export default function ExamSchedulePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryMsv = searchParams.get("msv") || "";
  const queryTab = searchParams.get("tab") || "";
  const { user } = useAuthStore();

  const [msvInput, setMsvInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{
    semester: string;
    student: { msv: string; fullName: string; dob: string; className: string } | null;
    schedules: ScheduleItem[];
    scores?: ExamScoreItem[];
    scoreStats?: ExamScoreStats;
    examResultNote: string;
    totalSubjects: number;
    source: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedMsv, setSavedMsv] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"hubt" | "scores" | "custom">("hubt");
  const [customSchedules, setCustomSchedules] = useState<CustomSchedule[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustom, setNewCustom] = useState({ subject: "", date: "", time: "", room: "", note: "" });
  const [copied, setCopied] = useState(false);
  const [copiedMsv, setCopiedMsv] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "upcoming" | "today" | "passed">("all");
  const [scoreSearch, setScoreSearch] = useState("");
  const [scoreViewMode, setScoreViewMode] = useState<"cards" | "table">("cards");

  useEffect(() => {
    if (queryTab === "scores") {
      setActiveTab("scores");
    } else if (queryTab === "custom") {
      setActiveTab("custom");
    } else if (queryTab === "schedule" || queryTab === "hubt") {
      setActiveTab("hubt");
    }
  }, [queryTab]);

  const scheduleCounts = useMemo(() => {
    const list = data?.schedules || [];
    return {
      all: list.length,
      today: list.filter(s => s.status === "today").length,
      upcoming: list.filter(s => s.status === "upcoming").length,
      passed: list.filter(s => s.status === "passed").length,
    };
  }, [data?.schedules]);

  const filteredSchedules = useMemo(() => {
    if (!data?.schedules) return [];
    if (filterStatus === "all") return data.schedules;
    return data.schedules.filter(s => s.status === filterStatus);
  }, [data?.schedules, filterStatus]);

  // Load saved MSV and custom schedules from user profile or localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedMsv = user?.student_id || localStorage.getItem("openquiz_saved_msv") || "2823231208";
      setSavedMsv(storedMsv);

      const targetMsv = queryMsv || storedMsv;
      if (targetMsv) {
        setMsvInput(targetMsv);
        fetchSchedule(targetMsv);
      }

      try {
        const storedCustom = localStorage.getItem("openquiz_custom_schedules");
        if (storedCustom) {
          setCustomSchedules(JSON.parse(storedCustom));
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [queryMsv, user?.student_id]);

  const fetchSchedule = async (searchCode: string, forceRefresh = false) => {
    const code = searchCode.trim();
    if (!code) return;

    setLoading(true);
    setError(null);

    try {
      // Ưu tiên gọi Next.js API serverless route, fallback qua axios instance
      let resData = null;
      const refreshParam = forceRefresh ? '&refresh=1' : '';
      try {
        const localRes = await fetch(`/api/schedule?msv=${encodeURIComponent(code)}${refreshParam}`);
        const json = await localRes.json();
        if (json.success) {
          resData = json.data;
        } else {
          setError(json.message || "Không tìm thấy dữ liệu.");
        }
      } catch (clientErr) {
        // Fallback to Laravel backend API
        const { data: apiData } = await api.get(`/exam-schedule/lookup?msv=${encodeURIComponent(code)}${refreshParam}`);
        if (apiData.success) {
          resData = apiData.data;
        } else {
          setError(apiData.message || "Không tìm thấy dữ liệu.");
        }
      }

      if (resData) {
        setData(resData);
      }
    } catch (err: any) {
      console.error("Lỗi tra cứu lịch thi:", err);
      setError("Không thể tra cứu lịch thi lúc này. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!msvInput.trim()) return;
    fetchSchedule(msvInput, true);
  };

  const handleSaveDefault = () => {
    if (!msvInput.trim()) return;
    localStorage.setItem("openquiz_saved_msv", msvInput.trim());
    setSavedMsv(msvInput.trim());
    alert(`Đã lưu "${msvInput.trim()}" làm Mã sinh viên mặc định của bạn!`);
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustom.subject.trim()) return;
    const item: CustomSchedule = {
      id: Date.now().toString(),
      subject: newCustom.subject.trim(),
      date: newCustom.date,
      time: newCustom.time,
      room: newCustom.room.trim(),
      note: newCustom.note.trim()
    };
    const updated = [item, ...customSchedules];
    setCustomSchedules(updated);
    localStorage.setItem("openquiz_custom_schedules", JSON.stringify(updated));
    setShowAddModal(false);
    setNewCustom({ subject: "", date: "", time: "", room: "", note: "" });
  };

  const handleDeleteCustom = (id: string) => {
    const updated = customSchedules.filter(item => item.id !== id);
    setCustomSchedules(updated);
    localStorage.setItem("openquiz_custom_schedules", JSON.stringify(updated));
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Lịch thi ${data?.student?.fullName || msvInput}`,
          text: `Tra cứu lịch thi & điểm thi sinh viên trên OpenQuiz`,
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

  const getStatusBadge = (status: string, countdown: string) => {
    switch (status) {
      case "today":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse">
            🔥 {countdown}
          </span>
        );
      case "upcoming":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
            ⏳ {countdown}
          </span>
        );
      case "passed":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
            ✓ {countdown}
          </span>
        );
    }
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
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Lịch thi & Điểm thi
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {data?.source ? data.source : "Khoa CNTT - HUBT Live"}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Tra cứu trực tuyến lịch thi học kỳ, điểm kiểm tra điều kiện (KT) và thời gian thi từ Khoa CNTT - HUBT.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => fetchSchedule(msvInput || savedMsv || "2823231208", true)}
            disabled={loading}
            title="Đồng bộ lại lịch thi mới nhất từ Cổng Nhà trường"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition-all shadow-xs disabled:opacity-50"
          >
            <RefreshCcw className={cn("w-3.5 h-3.5 text-primary", loading && "animate-spin")} />
            <span>{loading ? "Đang tải..." : "Làm mới"}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition-all shadow-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? "Đã copy link" : "Chia sẻ"}</span>
          </button>

          <a
            href="https://fit.hubt.edu.vn/lichthi/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold transition-all border border-border"
          >
            <span>Cổng Khoa CNTT HUBT</span>
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          </a>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={msvInput}
              onChange={(e) => setMsvInput(e.target.value)}
              placeholder="Nhập mã sinh viên (ví dụ: 2823231208) hoặc tên lớp..."
              className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={loading || !msvInput.trim()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-xs disabled:opacity-50"
            >
              {loading ? (
                <RefreshCcw className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              <span>Tra cứu</span>
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
                fetchSchedule(savedMsv);
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
              fetchSchedule("2823231208");
            }}
            className="px-2.5 py-1 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors"
          >
            Demo MSV: 2823231208
          </button>
          <button
            onClick={() => {
              setMsvInput("PM28.04");
              fetchSchedule("PM28.04");
            }}
            className="px-2.5 py-1 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors"
          >
            Lớp: PM28.04
          </button>
        </div>
      </div>

      {/* Disclaimer / Nguồn dữ liệu & Bảo vệ thông tin */}
      <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 flex items-start gap-3 text-xs text-muted-foreground leading-relaxed">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-foreground">Lưu ý & Nguồn dữ liệu: </span>
          Dữ liệu lịch thi và điểm điều kiện được trích xuất từ các cổng tra cứu công khai của Nhà trường nhằm hỗ trợ sinh viên quản lý thời gian ôn thi cá nhân. OpenQuiz không đại diện cho bất kỳ cơ sở giáo dục nào. Sinh viên vui lòng đối chiếu lại với lịch thi niêm yết chính thức từ phòng Đào tạo / Khoa. Xem thêm{" "}
          <Link href="/terms" target="_blank" className="text-primary underline hover:text-primary/80 font-medium">
            Điều khoản sử dụng
          </Link>{" "}
          và{" "}
          <Link href="/privacy" target="_blank" className="text-primary underline hover:text-primary/80 font-medium">
            Chính sách bảo mật
          </Link>.
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-1 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab("hubt")}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2",
              activeTab === "hubt"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Building2 className="w-4 h-4" />
            <span>Lịch thi học kỳ</span>
            {data?.schedules && (
              <span className={cn(
                "px-1.5 py-0.2 rounded-full text-[11px] font-bold",
                activeTab === "hubt" ? "bg-white/20 text-white" : "bg-muted text-foreground"
              )}>
                {data.schedules.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("scores")}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2",
              activeTab === "scores"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Award className="w-4 h-4" />
            <span>Kết quả & Điểm thi</span>
            {data?.scores && data.scores.length > 0 ? (
              <span className={cn(
                "px-2 py-0.2 rounded-full text-[11px] font-bold",
                activeTab === "scores"
                  ? "bg-white/20 text-white"
                  : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25"
              )}>
                {data.scores.length} môn
              </span>
            ) : (
              <span className={cn(
                "px-1.5 py-0.2 rounded-full text-[10px] font-semibold",
                activeTab === "scores" ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
              )}>
                Mới
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("custom")}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2",
              activeTab === "custom"
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            <Calendar className="w-4 h-4" />
            <span>Ghi chú riêng</span>
            {customSchedules.length > 0 && (
              <span className={cn(
                "px-1.5 py-0.2 rounded-full text-[11px] font-bold",
                activeTab === "custom" ? "bg-white/20 text-white" : "bg-muted text-foreground"
              )}>
                {customSchedules.length}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "scores" && data?.scores && data.scores.length > 0 && (
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In bảng điểm</span>
            </button>
          )}

          {activeTab === "custom" && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm môn thi</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: HUBT ITC SCHEDULE & SCORES */}
      {activeTab === "hubt" && (
        <div className="space-y-6">
          {loading ? (
            <div className="p-12 text-center bg-card border border-border rounded-2xl shadow-xs space-y-3">
              <RefreshCcw className="w-8 h-8 animate-spin text-primary mx-auto" />
              <p className="text-foreground font-semibold text-sm">Đang kết nối đến cổng Khoa CNTT - HUBT...</p>
              <p className="text-xs text-muted-foreground">Đang tải lịch thi chi tiết, phòng thi và điểm kiểm tra điều kiện</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center bg-card border border-destructive/30 rounded-2xl shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-foreground">Không tìm thấy thông tin</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">{error}</p>
              <button
                onClick={() => fetchSchedule(savedMsv || "2823231208")}
                className="px-4 py-2 bg-secondary text-foreground text-xs font-semibold rounded-xl hover:bg-secondary/80 transition-colors"
              >
                Thử lại với MSV mẫu
              </button>
            </div>
          ) : data ? (
            <>
              {/* Student Info Passport Card */}
              {data.student && (
                <div className="relative overflow-hidden bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-2xs before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-primary">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-13 h-13 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-black text-xl shadow-xs shrink-0">
                        {data.student.fullName.charAt(0) || "SV"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight">
                            {data.student.fullName}
                          </h2>
                          <button
                            onClick={() => {
                              if (data?.student?.msv) {
                                navigator.clipboard.writeText(data.student.msv);
                                setCopiedMsv(true);
                                setTimeout(() => setCopiedMsv(false), 2000);
                              }
                            }}
                            title="Click để sao chép MSV"
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold bg-muted hover:bg-muted/80 text-foreground border border-border/80 transition-colors"
                          >
                            <span>{data.student.msv}</span>
                            {copiedMsv ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                        <div className="flex items-center gap-2.5 text-xs text-muted-foreground mt-1 flex-wrap">
                          <span>Lớp: <strong className="text-foreground font-semibold">{data.student.className}</strong></span>
                          <span>•</span>
                          <span>Ngày sinh: <strong className="text-foreground font-semibold">{data.student.dob}</strong></span>
                          <span>•</span>
                          <span className="text-primary font-medium">{data.semester}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-start sm:self-center flex-wrap">
                      <div className="bg-muted/50 px-4 py-2.5 rounded-xl border border-border/60 text-right">
                        <span className="text-[11px] font-medium text-muted-foreground block">Môn thi học kỳ</span>
                        <span className="text-lg sm:text-xl font-black font-mono tabular-nums text-foreground">
                          {data.totalSubjects} môn
                        </span>
                      </div>

                      {data?.scores && data.scores.length > 0 && (
                        <button
                          onClick={() => setActiveTab("scores")}
                          className="px-3.5 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs hover:scale-[1.02] active:scale-95"
                          title="Bấm để xem ngay điểm thi trắc nghiệm và điểm học phần của bạn"
                        >
                          <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          <span>Xem điểm thi ({data.scores.length} môn)</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Status Filter Bar & Section Header */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-primary" />
                    <h3 className="text-base font-extrabold text-foreground tracking-tight">
                      Lịch thi chi tiết ({data.schedules.length})
                    </h3>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    <button
                      onClick={() => setFilterStatus("all")}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5",
                        filterStatus === "all"
                          ? "bg-foreground text-background shadow-xs font-bold"
                          : "bg-muted text-muted-foreground hover:text-foreground border border-border/60"
                      )}
                    >
                      <span>Tất cả</span>
                      <span className="text-[10px] opacity-80">({scheduleCounts.all})</span>
                    </button>

                    {scheduleCounts.today > 0 && (
                      <button
                        onClick={() => setFilterStatus("today")}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 animate-pulse",
                          filterStatus === "today"
                            ? "bg-rose-500 text-white font-bold shadow-xs"
                            : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                        )}
                      >
                        <span>🔥 Hôm nay</span>
                        <span className="text-[10px]">({scheduleCounts.today})</span>
                      </button>
                    )}

                    <button
                      onClick={() => setFilterStatus("upcoming")}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5",
                        filterStatus === "upcoming"
                          ? "bg-primary text-primary-foreground font-bold shadow-xs"
                          : "bg-muted text-muted-foreground hover:text-foreground border border-border/60"
                      )}
                    >
                      <span>⏳ Sắp thi</span>
                      <span className="text-[10px]">({scheduleCounts.upcoming})</span>
                    </button>

                    <button
                      onClick={() => setFilterStatus("passed")}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5",
                        filterStatus === "passed"
                          ? "bg-muted-foreground text-background font-bold shadow-xs"
                          : "bg-muted text-muted-foreground hover:text-foreground border border-border/60"
                      )}
                    >
                      <span>✓ Đã qua</span>
                      <span className="text-[10px]">({scheduleCounts.passed})</span>
                    </button>
                  </div>
                </div>

                {/* Schedules Grid / Cards */}
                {filteredSchedules.length === 0 ? (
                  <div className="p-8 text-center bg-card border border-border rounded-2xl shadow-xs space-y-2">
                    <p className="text-sm font-semibold text-foreground">Không có ca thi nào trong mục này</p>
                    <p className="text-xs text-muted-foreground">Chọn &quot;Tất cả&quot; để xem toàn bộ danh sách môn thi học kỳ.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredSchedules.map((item, idx) => {
                      const dateParts = item.date ? item.date.split("/") : [];
                      const dayNumber = dateParts[0] || "09";
                      const monthNumber = dateParts[1] || "10";

                      return (
                        <div
                          key={idx}
                          className={cn(
                            "bg-card rounded-2xl border p-4 sm:p-5 shadow-xs transition-all hover:shadow-md flex flex-col justify-between space-y-4 group",
                            item.status === "today"
                              ? "border-rose-500/40 ring-1 ring-rose-500/20 bg-rose-500/2"
                              : item.status === "upcoming"
                              ? "border-blue-500/30 hover:border-blue-500/60"
                              : "border-border/70 opacity-90"
                          )}
                        >
                          {/* Boarding Pass Header */}
                          <div className="flex items-start gap-3.5">
                            {/* Calendar Date Block */}
                            <div className="flex flex-col items-center justify-center w-13 h-13 sm:w-14 sm:h-14 rounded-xl bg-muted/60 border border-border shadow-xs shrink-0 text-center">
                              <span className="text-[9px] font-black uppercase tracking-wider text-primary">
                                Thg {monthNumber}
                              </span>
                              <span className="text-xl font-black text-foreground tabular-nums leading-none mt-0.5">
                                {dayNumber}
                              </span>
                              <span className="text-[9px] text-muted-foreground font-semibold font-mono mt-0.5">
                                {item.time || "10h30"}
                              </span>
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                {getStatusBadge(item.status, item.countdownText)}
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-muted text-foreground border border-border/60">
                                  <MapPin className="w-3 h-3 text-primary shrink-0" /> Phòng {item.room}
                                </span>
                              </div>

                              <h4 className="font-extrabold text-base sm:text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                                {item.subject}
                              </h4>

                              {item.className && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Lớp: <span className="font-medium text-foreground">{item.className}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Score & Condition Chip */}
                          <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-muted/30 border border-border/50 text-xs">
                            <div className="flex items-center gap-2">
                              <Award className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                              <div>
                                <span className="text-muted-foreground block text-[10px]">Điểm kiểm tra (KT)</span>
                                <span className={cn("text-xs font-bold font-mono tabular-nums", getScoreColor(item.testScore))}>
                                  {item.testScore !== null ? `${item.testScore}/10` : "Chưa có"}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <div>
                                <span className="text-muted-foreground block text-[10px]">Điều kiện dự thi</span>
                                <span className={cn(
                                  "text-[11px] font-semibold",
                                  item.testScore === null
                                    ? "text-muted-foreground"
                                    : item.testScore >= 8.5
                                    ? "text-emerald-600 dark:text-emerald-400 font-bold"
                                    : item.testScore >= 4.0
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-rose-500 font-bold"
                                )}>
                                  {item.testScore === null
                                    ? "Đang cập nhật"
                                    : item.testScore >= 8.5
                                    ? "Xuất sắc ✓"
                                    : item.testScore >= 4.0
                                    ? "Đủ điều kiện ✓"
                                    : "Cảnh báo ⚠️"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-[11px] text-muted-foreground">
                              {item.duration ? `⏱ ${item.duration}` : "Trắc nghiệm máy iTest"}
                            </span>

                            <Link
                              href={`/dashboard/quizzes?search=${encodeURIComponent(item.searchKeyword || item.subject)}`}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-xs transition-all active:scale-95"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Luyện đề môn này</span>
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Official Exam Result Status Box */}
              <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Lưu ý phòng thi & Kết quả chính thức</h4>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {data.examResultNote || "Sinh viên chú ý mang theo Thẻ sinh viên hoặc CCCD và có mặt trước giờ thi ít nhất 15 phút."}
                    </p>
                  </div>
                </div>

                <Link
                  href="/dashboard/history"
                  className="px-3.5 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold transition-colors self-start sm:self-auto shrink-0"
                >
                  Xem lịch sử thi OpenQuiz
                </Link>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* TAB: KẾT QUẢ & ĐIỂM THI TRẮC NGHIỆM */}
      {activeTab === "scores" && (
        <div className="space-y-6">
          {!data?.scores || data.scores.length === 0 ? (
            <div className="p-12 text-center bg-card border border-dashed border-border rounded-2xl shadow-xs space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
                <Award className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-base font-bold text-foreground">Chưa có kết quả điểm thi học kỳ</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Hiện chưa tìm thấy bảng điểm thi trắc nghiệm cho mã sinh viên <span className="font-semibold text-foreground">"{msvInput || savedMsv || 'này'}"</span> trên cổng ITC HUBT. Điểm thi trắc nghiệm thường được cập nhật sau khi các ca thi hoàn tất.
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 pt-2 flex-wrap">
                <button
                  onClick={() => fetchSchedule(msvInput || savedMsv || "2823231208", true)}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-xs flex items-center gap-1.5 hover:bg-primary/90 transition-colors"
                >
                  <RefreshCcw className="w-3.5 h-3.5" /> Thử tải lại dữ liệu mới
                </button>
                <button
                  onClick={() => {
                    setMsvInput("2823231208");
                    fetchSchedule("2823231208");
                  }}
                  className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors"
                >
                  Xem dữ liệu mẫu (MSV 2823231208)
                </button>
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      )}

      {/* TAB 2: CUSTOM / PERSONAL SCHEDULE */}
      {activeTab === "custom" && (
        <div className="space-y-4">
          {customSchedules.length === 0 ? (
            <div className="p-12 text-center bg-card border border-dashed border-border rounded-2xl shadow-xs space-y-3">
              <Calendar className="w-10 h-10 text-muted-foreground/40 mx-auto" />
              <h3 className="text-base font-bold text-foreground">Chưa có lịch thi ghi chú</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Bạn có thể thêm lịch thi của các môn khác (tự luận, đồ án, tiểu luận...) để theo dõi toàn bộ ngày thi tại một nơi.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shadow-xs"
              >
                <Plus className="w-4 h-4" /> Thêm lịch thi ngay
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customSchedules.map((item) => (
                <div key={item.id} className="bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-base text-foreground">{item.subject}</h4>
                      {item.note && <p className="text-xs text-muted-foreground mt-1">{item.note}</p>}
                    </div>
                    <button
                      onClick={() => handleDeleteCustom(item.id)}
                      className="p-1.5 text-muted-foreground hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-colors"
                      title="Xóa lịch thi này"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/60 text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Ngày</span>
                      <span className="font-semibold text-foreground">{item.date || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Giờ</span>
                      <span className="font-semibold text-foreground">{item.time || "—"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Phòng</span>
                      <span className="font-semibold text-foreground">{item.room || "—"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: Thêm môn thi ghi chú */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-card rounded-2xl border border-border shadow-2xl p-5 space-y-4">
            <h3 className="font-bold text-base text-foreground">Thêm lịch thi ghi chú</h3>
            
            <form onSubmit={handleAddCustom} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-foreground block mb-1">Tên môn thi *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Triết học Mác - Lênin, Đồ án chuyên ngành..."
                  value={newCustom.subject}
                  onChange={(e) => setNewCustom({ ...newCustom, subject: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:border-primary outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-semibold text-foreground block mb-1">Ngày thi</label>
                  <input
                    type="date"
                    value={newCustom.date}
                    onChange={(e) => setNewCustom({ ...newCustom, date: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-background border border-border text-foreground text-xs focus:border-primary outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-foreground block mb-1">Giờ thi</label>
                  <input
                    type="time"
                    value={newCustom.time}
                    onChange={(e) => setNewCustom({ ...newCustom, time: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-background border border-border text-foreground text-xs focus:border-primary outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Phòng thi / Giảng đường</label>
                <input
                  type="text"
                  placeholder="Ví dụ: B201, Hội trường lớn..."
                  value={newCustom.room}
                  onChange={(e) => setNewCustom({ ...newCustom, room: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-background border border-border text-foreground text-xs focus:border-primary outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Ghi chú thêm</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Mang thẻ sinh viên, nộp báo cáo trước 1 ngày..."
                  value={newCustom.note}
                  onChange={(e) => setNewCustom({ ...newCustom, note: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-background border border-border text-foreground text-xs focus:border-primary outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-muted-foreground hover:bg-muted font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold shadow-xs hover:bg-primary/90 transition-colors"
                >
                  Lưu lịch thi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
