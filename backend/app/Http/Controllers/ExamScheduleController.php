<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class ExamScheduleController extends Controller
{
    /**
     * Tra cứu lịch thi & điểm thi từ cổng HUBT ITC
     */
    public function lookup(Request $request)
    {
        $msv = trim($request->input('msv', ''));

        if (empty($msv)) {
            return response()->json([
                'success' => false,
                'message' => 'Vui lòng cung cấp mã sinh viên hoặc tên lớp.'
            ], 400);
        }

        $cacheKey = 'hubt_schedule_' . strtoupper($msv);
        $cachedData = Cache::get($cacheKey);
        if ($cachedData) {
            return response()->json($cachedData);
        }

        try {
            $targetUrl = 'https://itc.hubt.edu.vn/tra-cuu/lich-thi?msv=' . urlencode($msv);
            
            $response = Http::withoutVerifying()
                ->timeout(10)
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language' => 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
                ])
                ->get($targetUrl);

            if (!$response->successful()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Không thể kết nối đến cổng tra cứu ITC HUBT (' . $response->status() . ').'
                ], 502);
            }

            $html = $response->body();

            // Kiểm tra bảng lịch thi
            if (!preg_match('/<table[^>]*>(.*?)<\/table>/is', $html, $tableMatch)) {
                $msg = 'Chưa có lịch thi chi tiết cho thông tin tìm kiếm này hoặc không tìm thấy sinh viên.';
                if (preg_match('/<p[^>]*class="[^"]*text-slate-500[^"]*"[^>]*>(.*?)<\/p>/is', $html, $msgMatch)) {
                    $msg = trim(strip_tags($msgMatch[1]));
                }
                return response()->json([
                    'success' => false,
                    'message' => $msg
                ]);
            }

            // Lấy thông tin học kỳ
            $semester = 'LỊCH THI HỌC KỲ';
            if (preg_match('/<h2[^>]*>(.*?)<\/h2>/is', $html, $semMatch)) {
                $semester = trim(preg_replace('/\s+/', ' ', strip_tags($semMatch[1])));
            }

            // Phân tích các hàng
            $tbodyHtml = $tableMatch[1];
            if (preg_match('/<tbody[^>]*>(.*?)<\/tbody>/is', $tableMatch[1], $tbMatch)) {
                $tbodyHtml = $tbMatch[1];
            }

            preg_match_all('/<tr[^>]*>(.*?)<\/tr>/is', $tbodyHtml, $rows);

            $schedules = [];
            $studentInfo = null;
            $now = now();

            if (!empty($rows[1])) {
                foreach ($rows[1] as $rowHtml) {
                    preg_match_all('/<td[^>]*>(.*?)<\/td>/is', $rowHtml, $cellsMatch);
                    $cells = array_map(function ($c) {
                        return trim(strip_tags($c));
                    }, $cellsMatch[1] ?? []);

                    if (count($cells) >= 10) {
                        $itemDateStr = $cells[8] ?? '';
                        $itemTimeStr = $cells[9] ?? '';

                        $status = 'upcoming';
                        $countdownText = '';

                        if (!empty($itemDateStr)) {
                            $parts = explode('/', $itemDateStr);
                            if (count($parts) === 3) {
                                $timeParts = explode('h', strtolower($itemTimeStr));
                                $h = (int) ($timeParts[0] ?? 8);
                                $m = (int) ($timeParts[1] ?? 0);
                                
                                try {
                                    $examDt = \Carbon\Carbon::create((int)$parts[2], (int)$parts[1], (int)$parts[0], $h, $m);
                                    if ($examDt->isPast() && $examDt->diffInHours($now) > 4) {
                                        $status = 'passed';
                                        $countdownText = 'Đã thi xong';
                                    } elseif ($examDt->isToday()) {
                                        $status = 'today';
                                        $countdownText = 'Hôm nay thi!';
                                    } else {
                                        $days = $now->diffInDays($examDt, false);
                                        if ($days == 1) {
                                            $countdownText = 'Ngày mai thi';
                                        } elseif ($days > 1) {
                                            $countdownText = "Còn {$days} ngày";
                                        } else {
                                            $countdownText = 'Đã qua';
                                            $status = 'passed';
                                        }
                                    }
                                } catch (\Exception $e) {}
                            }
                        }

                        $fullName = trim(($cells[2] ?? '') . ' ' . ($cells[3] ?? ''));
                        $subject = $cells[6] ?? '';

                        // Search keyword for quiz matching
                        $searchKeyword = '';
                        $subLower = mb_strtolower($subject);
                        if (str_contains($subLower, 'java')) $searchKeyword = 'java';
                        elseif (str_contains($subLower, 'đám mây') || str_contains($subLower, 'đtdm')) $searchKeyword = 'đám mây';
                        elseif (str_contains($subLower, 'mạng') || str_contains($subLower, 'qtm')) $searchKeyword = 'mạng';
                        elseif (str_contains($subLower, 'cơ sở dữ liệu') || str_contains($subLower, 'csdl')) $searchKeyword = 'csdl';
                        elseif (str_contains($subLower, 'web')) $searchKeyword = 'web';

                        $testScore = null;
                        if (!empty($cells[10])) {
                            $testScore = (float) str_replace(',', '.', $cells[10]);
                        }

                        $item = [
                            'index' => $cells[0] ?? (string)(count($schedules) + 1),
                            'msv' => $cells[1] ?? '',
                            'lastName' => $cells[2] ?? '',
                            'firstName' => $cells[3] ?? '',
                            'fullName' => $fullName,
                            'dob' => $cells[4] ?? '',
                            'className' => $cells[5] ?? '',
                            'subject' => $subject,
                            'room' => $cells[7] ?? '',
                            'date' => $itemDateStr,
                            'time' => $itemTimeStr,
                            'testScore' => $testScore,
                            'note' => $cells[11] ?? '',
                            'status' => $status,
                            'countdownText' => $countdownText,
                            'searchKeyword' => $searchKeyword
                        ];

                        if (!$studentInfo && !empty($item['msv'])) {
                            $studentInfo = [
                                'msv' => $item['msv'],
                                'fullName' => $item['fullName'],
                                'dob' => $item['dob'],
                                'className' => $item['className']
                            ];
                        }

                        $schedules[] = $item;
                    }
                }
            }

            $examResultNote = 'Chưa có kết quả thi trắc nghiệm.';
            if (preg_match_all('/<p[^>]*class="[^"]*text-slate-500[^"]*"[^>]*>(.*?)<\/p>/is', $html, $noteMatches)) {
                $lastNote = end($noteMatches[1]);
                if ($lastNote) {
                    $examResultNote = trim(strip_tags($lastNote));
                }
            }

            $payload = [
                'success' => true,
                'data' => [
                    'semester' => $semester,
                    'student' => $studentInfo,
                    'schedules' => $schedules,
                    'examResultNote' => $examResultNote,
                    'totalSubjects' => count($schedules),
                    'source' => 'HUBT ITC (Trung tâm Tin học ứng dụng)'
                ]
            ];

            Cache::put($cacheKey, $payload, 300); // 5 mins

            return response()->json($payload);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi kết nối khi tra cứu lịch thi từ hệ thống ITC HUBT.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
