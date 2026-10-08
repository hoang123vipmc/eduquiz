<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class ExamScheduleController extends Controller
{
    /**
     * Tra cứu lịch thi & điểm thi (Ưu tiên Khoa CNTT fit.hubt.edu.vn, fallback ITC)
     */
    public function lookup(Request $request)
    {
        $msv = trim((string) $request->input('msv', ''));

        if (empty($msv) || mb_strlen($msv) > 30 || !preg_match('/^[a-zA-Z0-9\s._-]+$/u', $msv)) {
            return response()->json([
                'success' => false,
                'message' => 'Mã sinh viên hoặc tên lớp không hợp lệ (tối đa 30 ký tự).'
            ], 400);
        }

        $isForceRefresh = $request->boolean('refresh') || $request->boolean('fresh');
        $cacheKey = 'hubt_schedule_' . strtoupper($msv);
        $cachedData = Cache::get($cacheKey);
        if (!$isForceRefresh && $cachedData) {
            return response()->json($cachedData);
        }

        try {
            // Tra cứu đồng thời cả cổng Khoa CNTT và ITC để ghép đầy đủ mọi môn
            $fitData = $this->lookupFit($msv);
            $itcData = $this->lookupItc($msv);

            $finalData = $this->mergeScheduleSources($fitData, $itcData);

            if ($finalData && !empty($finalData['schedules'])) {
                $payload = [
                    'success' => true,
                    'data' => $finalData
                ];
                $ttl = !empty($fitData['schedules']) ? 300 : 30;
                Cache::put($cacheKey, $payload, $ttl);
                return response()->json($payload);
            }

            return response()->json([
                'success' => false,
                'message' => 'Không tìm thấy dữ liệu lịch thi cho mã sinh viên hoặc lớp này. Vui lòng kiểm tra lại.'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lỗi kết nối khi tra cứu lịch thi HUBT.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Chuẩn hóa tên môn học để gộp trùng lặp
     */
    private function normalizeSubjectKey($name)
    {
        $str = mb_strtolower((string) $name, 'UTF-8');
        $str = str_replace(['đ', 'Đ'], 'd', $str);
        if (class_exists('Normalizer')) {
            $norm = \Normalizer::normalize($str, \Normalizer::FORM_D);
            if ($norm) {
                $str = preg_replace('/[\x{0300}-\x{036f}]/u', '', $norm);
            }
        }
        $str = preg_replace('/[^a-z0-9]/', '', $str);
        return trim($str);
    }

    /**
     * Gộp dữ liệu FIT và ITC đảm bảo không bao giờ sót môn
     */
    private function mergeScheduleSources($fitData, $itcData)
    {
        if (!$fitData && !$itcData) return null;
        if ($fitData && !$itcData) return $fitData;
        if (!$fitData && $itcData) return $itcData;

        $mergedSchedules = $fitData['schedules'] ?? [];
        $existingKeys = [];
        foreach ($mergedSchedules as $s) {
            $existingKeys[$this->normalizeSubjectKey($s['subject'] ?? '')] = true;
        }

        foreach (($itcData['schedules'] ?? []) as $itcItem) {
            $key = $this->normalizeSubjectKey($itcItem['subject'] ?? '');
            if (!isset($existingKeys[$key])) {
                $existingKeys[$key] = true;
                $itcItem['index'] = (string) (count($mergedSchedules) + 1);
                $mergedSchedules[] = $itcItem;
            }
        }

        $fitData['schedules'] = $mergedSchedules;
        $fitData['totalSubjects'] = count($mergedSchedules);
        $fitData['source'] = 'Khoa CNTT - HUBT (fit.hubt.edu.vn)';
        return $fitData;
    }

    /**
     * Lấy dữ liệu từ cổng Khoa CNTT: https://fit.hubt.edu.vn/wp-json/hubt/v1/lookup
     */
    private function lookupFit($msv)
    {
        try {
            $response = Http::withoutVerifying()
                ->retry(2, 600)
                ->timeout(12)
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json, text/plain, */*',
                    'Origin' => 'https://fit.hubt.edu.vn',
                    'Referer' => 'https://fit.hubt.edu.vn/lichthi/',
                ])
                ->post('https://fit.hubt.edu.vn/wp-json/hubt/v1/lookup', [
                    'mssv' => $msv
                ]);

            if (!$response->successful()) {
                return null;
            }

            $json = $response->json();
            $html = $json['html'] ?? '';

            if (empty($html) || str_contains($html, 'hubt-error') || mb_strlen($html) < 100) {
                return null;
            }

            // Parse student info
            $fullName = '';
            $className = '';
            if (preg_match_all('/class="hubt-info-value"[^>]*>(.*?)<\/[^>]+>/is', $html, $infoMatches)) {
                $values = array_map(function ($val) {
                    return trim(strip_tags($val));
                }, $infoMatches[1] ?? []);

                if (count($values) >= 3) {
                    $fullName = $values[0];
                    $className = $values[2];
                }
            }

            // Học kỳ
            $semester = 'LỊCH THI HỌC KỲ I - NĂM HỌC 2026-2027';
            if (preg_match('/Học kỳ\s*\d+[^<"]*/iu', $html, $semMatch)) {
                $semester = trim($semMatch[0]);
            }

            // Bảng ca thi
            $schedules = [];
            $tbodyHtml = $html;
            if (preg_match('/<tbody[^>]*>(.*?)<\/tbody>/is', $html, $tbMatch)) {
                $tbodyHtml = $tbMatch[1];
            }

            preg_match_all('/<tr[^>]*>(.*?)<\/tr>/is', $tbodyHtml, $rows);
            $now = Carbon::now();

            if (!empty($rows[1])) {
                foreach ($rows[1] as $rHtml) {
                    preg_match_all('/<td[^>]*>(.*?)<\/td>/is', $rHtml, $tdMatches);
                    $rawCells = $tdMatches[1] ?? [];

                    if (count($rawCells) >= 4) {
                        $dotCongBo = trim(strip_tags($rawCells[0]));
                        $subject = trim(strip_tags($rawCells[1]));
                        $scoreStr = trim(strip_tags($rawCells[2]));
                        $cell3Raw = $rawCells[3];
                        $room = isset($rawCells[4]) ? trim(strip_tags($rawCells[4])) : '';
                        $duration = isset($rawCells[5]) ? trim(strip_tags(str_replace('&#039;', "'", $rawCells[5]))) : '';

                        // Tách ngày và giờ
                        $dateStr = '';
                        $timeStr = '';
                        if (preg_match('/(\d{2}\/\d{2}\/\d{4})/', $cell3Raw, $dMatch)) {
                            $dateStr = $dMatch[1];
                        }
                        if (preg_match('/(\d{1,2}[:h]\d{2})/i', $cell3Raw, $tMatch)) {
                            $timeStr = str_replace(':', 'h', $tMatch[1]);
                        }

                        // Status badge
                        $status = 'upcoming';
                        $countdownText = '';
                        if (preg_match('/class="status-badge[^"]*"[^>]*>(.*?)<\/span>/is', $cell3Raw, $badgeMatch)) {
                            $countdownText = trim(strip_tags($badgeMatch[1]));
                            if (str_contains($cell3Raw, 'status-past') || str_contains($countdownText, 'Đã thi')) {
                                $status = 'passed';
                            } elseif (str_contains($cell3Raw, 'status-today') || str_contains($countdownText, 'Hôm nay')) {
                                $status = 'today';
                            } else {
                                $status = 'upcoming';
                            }
                        }

                        // Điểm số
                        $testScore = null;
                        if (!empty($scoreStr) && is_numeric(str_replace(',', '.', $scoreStr))) {
                            $testScore = (float) str_replace(',', '.', $scoreStr);
                        }

                        // Keyword tìm đề thi
                        $searchKeyword = $this->guessKeyword($subject);

                        if (!empty($subject)) {
                            $schedules[] = [
                                'index' => (string) (count($schedules) + 1),
                                'msv' => $msv,
                                'lastName' => '',
                                'firstName' => $fullName,
                                'fullName' => $fullName,
                                'dob' => '',
                                'className' => $className,
                                'subject' => $subject,
                                'room' => $room,
                                'date' => $dateStr,
                                'time' => $timeStr,
                                'duration' => $duration,
                                'testScore' => $testScore,
                                'note' => $dotCongBo,
                                'status' => $status,
                                'countdownText' => $countdownText,
                                'searchKeyword' => $searchKeyword,
                            ];
                        }
                    }
                }
            }

            // Lưu ý
            $warningNote = 'Lưu ý: Có mặt trước giờ thi 15 phút, mang theo Thẻ sinh viên hoặc CCCD.';
            if (preg_match('/<ul[^>]*class="hubt-warning-list"[^>]*>(.*?)<\/ul>/is', $html, $wlMatch)) {
                preg_match_all('/<li[^>]*>(.*?)<\/li>/is', $wlMatch[1], $liMatches);
                if (!empty($liMatches[1])) {
                    $notes = array_map(function ($li) {
                        return trim(strip_tags($li));
                    }, $liMatches[1]);
                    $warningNote = implode(' • ', $notes);
                }
            }

            return [
                'semester' => $semester,
                'student' => $fullName ? [
                    'msv' => $msv,
                    'fullName' => $fullName,
                    'dob' => '',
                    'className' => $className,
                ] : null,
                'schedules' => $schedules,
                'examResultNote' => $warningNote,
                'totalSubjects' => count($schedules),
                'source' => 'Khoa CNTT - HUBT (fit.hubt.edu.vn)',
            ];
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Lấy dữ liệu từ cổng ITC: https://itc.hubt.edu.vn/tra-cuu/lich-thi
     */
    private function lookupItc($msv)
    {
        try {
            $targetUrl = 'https://itc.hubt.edu.vn/tra-cuu/lich-thi?msv=' . urlencode($msv);
            $response = Http::withoutVerifying()
                ->timeout(8)
                ->withHeaders([
                    'User-Agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept' => 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Accept-Language' => 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7',
                ])
                ->get($targetUrl);

            if (!$response->successful()) {
                return null;
            }

            $html = $response->body();
            if (!preg_match('/<table[^>]*>(.*?)<\/table>/is', $html, $tableMatch)) {
                return null;
            }

            $semester = 'LỊCH THI HỌC KỲ';
            if (preg_match('/<h2[^>]*>(.*?)<\/h2>/is', $html, $semMatch)) {
                $semester = trim(preg_replace('/\s+/', ' ', strip_tags($semMatch[1])));
            }

            $tbodyHtml = $tableMatch[1];
            if (preg_match('/<tbody[^>]*>(.*?)<\/tbody>/is', $tableMatch[1], $tbMatch)) {
                $tbodyHtml = $tbMatch[1];
            }

            preg_match_all('/<tr[^>]*>(.*?)<\/tr>/is', $tbodyHtml, $rows);
            $schedules = [];
            $studentInfo = null;
            $now = Carbon::now();

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
                                    $examDt = Carbon::create((int)$parts[2], (int)$parts[1], (int)$parts[0], $h, $m);
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
                        $searchKeyword = $this->guessKeyword($subject);

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

            return [
                'semester' => $semester,
                'student' => $studentInfo,
                'schedules' => $schedules,
                'examResultNote' => $examResultNote,
                'totalSubjects' => count($schedules),
                'source' => 'HUBT ITC (Trung tâm Tin học ứng dụng)'
            ];
        } catch (\Exception $e) {
            return null;
        }
    }

    private function guessKeyword($subject)
    {
        $subLower = mb_strtolower($subject);
        if (str_contains($subLower, 'java')) return 'java';
        if (str_contains($subLower, 'đám mây') || str_contains($subLower, 'dtdm') || str_contains($subLower, 'điện toán')) return 'đám mây';
        if (str_contains($subLower, 'mã nguồn mở') || str_contains($subLower, 'open source')) return 'mã nguồn mở';
        if (str_contains($subLower, 'mạng') || str_contains($subLower, 'qtm')) return 'mạng';
        if (str_contains($subLower, 'cơ sở dữ liệu') || str_contains($subLower, 'csdl')) return 'cơ sở dữ liệu';
        if (str_contains($subLower, 'web')) return 'web';
        if (str_contains($subLower, 'python')) return 'python';
        if (str_contains($subLower, 'hệ điều hành')) return 'hệ điều hành';
        return explode(' ', $subject)[0] ?? '';
    }
}
