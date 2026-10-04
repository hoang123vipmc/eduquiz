"use client";

import React, { useState, useEffect } from "react";
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
  Check
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
  testScore: number | null;
  note: string;
  status: "upcoming" | "today" | "passed";
  countdownText: string;
  searchKeyword: string;
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
  const { user } = useAuthStore();

  const [msvInput, setMsvInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{
    semester: string;
    student: { msv: string; fullName: string; dob: string; className: string } | null;
    schedules: ScheduleItem[];
    examResultNote: string;
    totalSubjects: number;
    source: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedMsv, setSavedMsv] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"hubt" | "custom">("hubt");
  const [customSchedules, setCustomSchedules] = useState<CustomSchedule[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCustom, setNewCustom] = useState({ subject: "", date: "", time: "", room: "", note: "" });
  const [copied, setCopied] = useState(false);

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

  const fetchSchedule = async (searchCode: string) => {
    const code = searchCode.trim();
    if (!code) return;

    setLoading(true);
    setError(null);

    try {
      // Ưu tiên gọi Next.js API serverless route, fallback qua axios instance
      let resData = null;
      try {
        const localRes = await fetch(`/api/schedule?msv=${encodeURIComponent(code)}`);
        const json = await localRes.json();
        if (json.success) {
          resData = json.data;
        } else {
          setError(json.message || "Không tìm thấy dữ liệu.");
        }
      } catch (clientErr) {
        // Fallback to Laravel backend API
        const { data: apiData } = await api.get(`/exam-schedule/lookup?msv=${encodeURIComponent(code)}`);
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
    fetchSchedule(msvInput);
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
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                HUBT ITC Live
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Tra cứu trực tuyến lịch thi học kỳ, điểm kiểm tra (KT) và kết quả thi trắc nghiệm từ cổng trường.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-semibold transition-all shadow-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? "Đã copy link" : "Chia sẻ"}</span>
          </button>

          <a
            href="https://itc.hubt.edu.vn/tra-cuu/lich-thi"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold transition-all border border-border"
          >
            <span>Cổng trường HUBT</span>
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

      {/* Tabs */}
      <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-1">
        <div className="flex items-center gap-2">
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
            <span>Lịch thi HUBT ITC</span>
            {data?.schedules && (
              <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-white/20 text-white font-bold">
                {data.schedules.length}
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
              <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-muted text-foreground font-bold">
                {customSchedules.length}
              </span>
            )}
          </button>
        </div>

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

      {/* TAB 1: HUBT ITC SCHEDULE & SCORES */}
      {activeTab === "hubt" && (
        <div className="space-y-6">
          {loading ? (
            <div className="p-12 text-center bg-card border border-border rounded-2xl shadow-xs space-y-3">
              <RefreshCcw className="w-8 h-8 animate-spin text-primary mx-auto" />
              <p className="text-foreground font-semibold text-sm">Đang kết nối đến cổng ITC HUBT...</p>
              <p className="text-xs text-muted-foreground">Đang tải lịch thi chi tiết và điểm kiểm tra điều kiện</p>
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
              {/* Student Info Card */}
              {data.student && (
                <div className="relative overflow-hidden bg-gradient-to-r from-blue-900/40 via-indigo-900/25 to-card border border-blue-500/30 rounded-2xl p-5 sm:p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black text-xl shadow-md shrink-0">
                        {data.student.fullName.charAt(0) || "SV"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-lg sm:text-xl font-bold text-foreground">
                            {data.student.fullName}
                          </h2>
                          <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30">
                            {data.student.msv}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                          <span>Lớp: <strong className="text-foreground">{data.student.className}</strong></span>
                          <span>•</span>
                          <span>Ngày sinh: <strong className="text-foreground">{data.student.dob}</strong></span>
                          <span>•</span>
                          <span>{data.semester}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground block">Môn thi học kỳ</span>
                        <span className="text-xl sm:text-2xl font-black text-primary">{data.totalSubjects} môn</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Schedules Grid / Cards */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-primary" />
                    <span>Danh sách ca thi chính thức</span>
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    Dữ liệu đồng bộ trực tiếp từ ITC HUBT
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.schedules.map((item, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "bg-card rounded-2xl border p-4 sm:p-5 shadow-xs transition-all hover:shadow-md flex flex-col justify-between space-y-4 group",
                        item.status === "today" 
                          ? "border-rose-500/50 ring-2 ring-rose-500/10" 
                          : item.status === "upcoming" 
                          ? "border-blue-500/40" 
                          : "border-border"
                      )}
                    >
                      {/* Top: Status & Subject */}
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          {getStatusBadge(item.status, item.countdownText)}
                          <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-muted text-foreground border border-border">
                            Phòng: {item.room}
                          </span>
                        </div>

                        <h4 className="font-bold text-base sm:text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {item.subject}
                        </h4>
                        
                        {item.className && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Lớp: {item.className} {item.msv ? `• MSV: ${item.msv}` : ""}
                          </p>
                        )}
                      </div>

                      {/* Middle: Details Grid */}
                      <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-muted/40 border border-border/60 text-xs">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                          <div>
                            <span className="text-muted-foreground block text-[10px]">Ngày thi</span>
                            <span className="font-bold text-foreground">{item.date}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <div>
                            <span className="text-muted-foreground block text-[10px]">Giờ thi</span>
                            <span className="font-bold text-foreground">{item.time}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Award className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <div>
                            <span className="text-muted-foreground block text-[10px]">Điểm kiểm tra (KT)</span>
                            <span className={cn("text-sm", getScoreColor(item.testScore))}>
                              {item.testScore !== null ? `${item.testScore} / 10` : "Chưa có"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                          <div>
                            <span className="text-muted-foreground block text-[10px]">Phòng máy iTest</span>
                            <span className="font-bold text-foreground">{item.room}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action: Open Quiz corresponding to this subject */}
                      <div className="pt-2 border-t border-border/40 flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">
                          {item.note || "Hình thức: Trắc nghiệm iTest"}
                        </span>

                        <Link
                          href={`/dashboard/quizzes?search=${encodeURIComponent(item.searchKeyword || item.subject)}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow-2xs transition-all active:scale-95"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Luyện đề môn này</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Official Exam Result Status Box */}
              <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Kết quả thi trắc nghiệm chính thức</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {data.examResultNote || "Chưa có kết quả thi trắc nghiệm từ trung tâm."}
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
