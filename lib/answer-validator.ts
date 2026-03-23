export type AnswerType = 'CODE' | 'TEXT' | 'NUMBER'

export function validateAnswer(
  userInput: string,
  correctAnswer: string,
  type: AnswerType
): boolean {
  switch (type) {
    case 'CODE':
      return (
        userInput.replace(/\s/g, '').toLowerCase() ===
        correctAnswer.replace(/\s/g, '').toLowerCase()
      )
    case 'TEXT':
      return (
        userInput.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
      )
    case 'NUMBER':
      return parseInt(userInput.trim()) === parseInt(correctAnswer.trim())
    default:
      return false
  }
}
