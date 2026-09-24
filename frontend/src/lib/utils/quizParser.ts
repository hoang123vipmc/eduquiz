export interface ParsedOption {
  text: string;
  isCorrect: boolean;
}

export interface ParsedQuestion {
  questionText: string;
  options: ParsedOption[];
}

export function parseQuizText(text: string): ParsedQuestion[] {
  const lines = text.split('\n');
  const questionsData: ParsedQuestion[] = [];
  
  let currentQuestion: ParsedQuestion | null = null;
  let expectingNewQuestion = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line) {
      if (currentQuestion && currentQuestion.options.length > 0) {
        questionsData.push(currentQuestion);
        currentQuestion = null;
      }
      expectingNewQuestion = true;
      continue;
    }

    // Bỏ qua các đường kẻ phân cách dạng --- hoặc ===
    if (/^[-=_*]{3,}$/.test(line)) {
      continue;
    }

    // Nhận diện dòng chỉ định đáp án đúng (ví dụ: "=> Đáp án đúng: C", "Đáp án: A", "Answer: B")
    const ansMatch = line.match(/^(?:=>\s*)?(?:Đáp án(?:\s*đúng)?|Đ\/a|Answer|Key)\s*[:：]\s*([A-Fa-f1-6])/i);
    if (ansMatch && currentQuestion && currentQuestion.options.length > 0) {
      const letter = ansMatch[1].toUpperCase();
      const targetIdx = !isNaN(Number(letter)) ? (Number(letter) - 1) : (letter.charCodeAt(0) - 65);
      if (currentQuestion.options[targetIdx]) {
        currentQuestion.options.forEach(opt => { opt.isCorrect = false; });
        currentQuestion.options[targetIdx].isCorrect = true;
      }
      continue;
    }

    // Bắt đầu câu hỏi mới khi có tiền tố "Câu X:" hoặc đang chờ câu mới
    const isExplicitHeader = /^(?:Câu|Question)\s*\d+\s*[:：\.\)]/i.test(line);

    if (expectingNewQuestion || (isExplicitHeader && currentQuestion && currentQuestion.options.length > 0)) {
      if (currentQuestion && currentQuestion.options.length > 0) {
        questionsData.push(currentQuestion);
      }
      currentQuestion = {
        questionText: line,
        options: []
      };
      expectingNewQuestion = false;
      continue;
    }

    let isCorrectOption = line.startsWith('*');
    // Regex matches A. A) A- 1. 1) 1- (also handles " E .INT")
    const optionRegex = /^[A-F1-6]\s*[\.\)\-]/i;
    const isOption = isCorrectOption || optionRegex.test(line);

    if (isOption && currentQuestion) {
      let optText = line;
      if (isCorrectOption) {
        optText = line.substring(1).trim();
      }
      if (/^[A-F1-6]\s*[\.\)\-]\s*\*/i.test(optText)) {
        isCorrectOption = true;
        optText = optText.replace(/^([A-F1-6]\s*[\.\)\-])\s*\*/i, '$1 ');
      }
      
      currentQuestion.options.push({
        text: optText,
        isCorrect: isCorrectOption
      });
    } else if (currentQuestion) {
      if (currentQuestion.options.length === 0) {
        currentQuestion.questionText += '\n' + line;
      } else {
        const lastIdx = currentQuestion.options.length - 1;
        currentQuestion.options[lastIdx].text += '\n' + line;
      }
    }
  }

  if (currentQuestion && currentQuestion.options.length > 0) {
    questionsData.push(currentQuestion);
  }

  return questionsData;
}
