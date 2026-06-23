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

    if (expectingNewQuestion) {
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

    const isCorrectOption = line.startsWith('*');
    // Regex matches A. A) A- 1. 1) 1- (also handles " E .INT")
    const optionRegex = /^[A-E1-4]\s*[\.\)\-]/i;
    const isOption = isCorrectOption || optionRegex.test(line);

    if (isOption && currentQuestion) {
      let optText = line;
      if (isCorrectOption) {
        optText = line.substring(1).trim();
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
