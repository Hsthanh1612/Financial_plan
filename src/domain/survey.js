// Hai bảng khảo sát của Mockup.xlsx (sheet "Bảng khảo sát"). Điểm từng đáp án lấy từ cột E của sheet.
// Lưu ý đúng như mockup: câu 1 của khảo sát rủi ro có đáp án "4" và ">4" KHÔNG có điểm (cột E trống) nên tính 0.

const o = (label, score) => ({ label, score });

export const RISK_SURVEY = [
  { q: 'Bạn có bao nhiêu mục tiêu tài chính?', options: [o('1', 1), o('2', 2), o('3', 3), o('4', 0), o('>4', 0)] },
  { q: 'Bạn có cần thu nhập hàng tháng từ danh mục đầu tư không?', options: [o('Không', 1), o('Dưới 2%', 2), o('Lớn hơn 2%, nhưng nhỏ hơn 4%', 3), o('Lớn hơn 4%, nhưng nhỏ hơn 6%', 4), o('Lớn hơn 6%', 5)] },
  { q: 'Sau bao lâu thì bạn sẽ bắt đầu muốn rút tiền từ danh mục đầu tư của mình để phục vụ cho mục đích?', options: [o('Hơn 20 năm', 1), o('11–20 năm', 2), o('6–10 năm', 3), o('1–5 năm', 4), o('Ngay lập tức', 5)] },
  { q: 'Hãy mô tả quan điểm của bạn đối với vấn đề mức sinh lời và rủi ro từ việc đầu tư?', options: [
    o('Vấn đề bạn quan tâm nhất là hạn chế rủi ro. Bạn sẵn sàng chấp nhận mức sinh lời thấp để hạn chế tối đa rủi ro thua lỗ', 1),
    o('Bạn sẵn sàng chấp nhận khả năng rủi ro đầu tư để đạt mức sinh lời vừa phải', 2),
    o('Bạn chủ yếu quan tâm đến việc tối đa hóa mức sinh lời để có thể đạt được mục tiêu như kế hoạch', 3),
    o('Bạn sẵn sàng chấp rủi ro cao để sớm đạt được mục tiêu tài chính của mình', 4)] },
  { q: 'Biểu đồ bên dưới cho thấy mức sinh lời trung bình của ba danh mục đầu tư trong thời gian 20 năm. Danh mục nào theo bạn là phù hợp với bạn nhất?', options: [o('Danh mục đầu tư X', 1), o('Danh mục đầu tư Y', 2), o('Danh mục đầu tư Z', 3)] },
  { q: 'Rủi ro danh mục đầu tư bị giảm giá trị (có mức sinh lời âm) thường là mối quan tâm hàng đầu của các nhà đầu tư. Tuy nhiên, để đạt được mức sinh lời cao hơn, nhà đầu tư phải sẵn sàng chấp nhận rủi ro lớn hơn. Bảng sau mô tả bốn các danh mục đầu tư với các thông tin về giá trị dự kiến và khả năng lỗ tiềm năng. Hãy cho biết bạn cảm thấy thoải mái khi lựa chọn danh mục nào nhất?',
    options: [o('Danh mục A — kỳ vọng 107 triệu / 100 triệu, khả năng lỗ 19%', 1), o('Danh mục B — kỳ vọng 108 triệu / 100 triệu, khả năng lỗ 23%', 2), o('Danh mục C — kỳ vọng 109 triệu / 100 triệu, khả năng lỗ 26%', 3), o('Danh mục D — kỳ vọng 110 triệu / 100 triệu, khả năng lỗ 28%', 4)] },
  { q: 'Lạm phát có thể làm sụt giảm mức sinh lời thực tế từ danh mục đầu tư theo thời gian. Ví dụ, trong một năm điển hình với 3,5% tỷ lệ lạm phát, lợi nhuận 6% trước khi lạm phát sẽ có giá trị lợi nhuận thực chỉ 2,5%. Thông tin nào sau đây thể hiện quan điểm của bạn về nỗi lo lạm phát?', options: [
    o('Bạn muốn giảm thiểu những biến động trong ngắn hạn cho danh mục đầu tư của mình càng nhiều càng tốt, việc cao hơn mức lạm phát hàng năm đáng kể không quá quan trọng', 1),
    o('Muốn một danh mục đầu tư cao hơn mức lạm phát vừa phải và sẵn sàng chấp nhận mức sụt giảm vừa phải trong ngắn hạn để đạt được mục tiêu này', 2),
    o('Mức sinh lời của danh mục có thể vượt xa mức lạm phát trong dài hạn và bạn sẵn sàng chấp nhận những mức sụt giảm có thể trong ngắn hạn để đạt được mục tiêu này', 3)] },
  { q: 'Việc đầu tư đôi khi phải đối mặt với những khoản lỗ. Bạn nghĩ gì về những giai đoạn có những khoản lỗ cho danh mục của mình?', options: [
    o('Bạn sẽ bán các khoản đầu tư ngay lập tức nếu mức giảm đáng kể xảy ra', 1),
    o('Mặc dù việc sụt giảm khiến bạn không thoải mái nhưng bạn sẵn sàng chờ đợi giai đoạn phục hồi phía sau', 2),
    o('Bạn chịu được việc danh mục sụt giảm và hoàn có thể duy trì trạng thái đầu tư của danh mục trong một năm', 3),
    o('Cho dù danh mục đầu tư của bạn có sụt giảm trong vài năm tuy nhiên bạn đủ nhận thức để kiên định với mục tiêu dài hạn ban đầu', 4)] },
  { q: 'Giá trị đầu tư tài sản hiện tại của bạn là?', options: [o('Dưới 200 triệu đồng', 1), o('200 triệu đồng – 500 triệu đồng', 2), o('500 triệu đến 1 tỷ đồng', 3), o('Từ 1-2 tỷ đồng', 4), o('Hơn 2 tỷ đồng', 5)] },
  { q: 'Tỷ lệ tiết kiệm của bạn hàng tháng sau khi trừ các chi phí?', options: [o('Dưới 10%', 1), o('10-20%', 2), o('20-30%', 3), o('30-50%', 4), o('>50%', 5)] },
];

export const CIRCUMSTANCE_SURVEY = [
  { q: 'Tỷ lệ trích thu nhập hàng tháng của bạn để gởi về cho gia đình?', options: [o('>30%', 1), o('20-30%', 2), o('10-20%', 3), o('0-10%', 4), o('0', 5)] },
  { q: 'Mức thu nhập của vợ/chồng của bạn so với bạn?', options: [o('<50%', 1), o('50-70%', 2), o('70-100%', 3), o('100-150%', 4), o('150-300%', 5)] },
  { q: 'Tần suất bạn quan tâm đến mạng xã hội mỗi ngày?', options: [o('3-4 giờ', 1), o('2-3 giờ', 2), o('1-2 giờ', 3), o('30 phút - 60 phút', 4), o('<30 phút', 5)] },
  { q: 'Số lượng bạn bè của bạn trên Facebook?', options: [o('<100', 1), o('100-200', 2), o('200-400', 3), o('400-800', 4), o('>800', 5)] },
  { q: 'Bạn xây dựng như thế nào về kế hoạch đầu mỗi năm?', options: [o('Chưa bao giờ', 1), o('Hiếm khi', 2), o('Tùy hứng', 3), o('Thường xuyên', 4), o('Hầu như năm nào cũng lập', 5)] },
  { q: 'Bạn có bao nhiêu em nhỏ trong gia đình còn đi học?', options: [o('4', 1), o('3', 2), o('2', 3), o('1', 4), o('0', 5)] },
  { q: 'Bạn nghĩ gì về việc tích lũy một lượng tài sản nhất định để lại cho con cái?', options: [o('Chỉ hỗ trợ con cái chi phí giáo dục', 2), o('Trang bị các phương tiện cơ bản', 3), o('Để lại các tài sản lớn cho con cái', 4), o('Tích lũy nhiều nhất có thể', 5)] },
  { q: 'Bạn đánh giá sức khỏe của mình như thế nào so với bạn bè và những người khác?', options: [o('Kém hơn rất nhiều', 1), o('Kém hơn', 2), o('Bằng mức trung bình', 3), o('Tốt hơn', 4), o('Tốt hơn rất nhiều', 5)] },
  { q: 'Mô tả tình hình tài chính của bạn khi bạn khi còn đi học?', options: [o('Phụ thuộc hoàn toàn vào gia đình', 2), o('Gia đình hỗ trợ học phí và vẫn phải đi làm thêm', 3), o('Tự đi làm thêm để lo cho mình', 4)] },
  { q: 'Bạn đánh giá như thế nào trong mức chênh lệch thu nhập của những người làm trong công ty của mình?', options: [o('Không đáng kể', 1), o('Chênh lệch vừa phải', 2), o('Tương đối lớn', 3), o('Rất lớn', 4)] },
  { q: 'Mức tăng thu nhập trung bình hàng năm của bạn trong 3 năm gần nhất?', options: [o('Gần như không tăng', 1), o('<5%', 2), o('5-10%', 3), o('10-20%', 4), o('20-30%', 5), o('>30%', 6)] },
];

/** answers: { [chỉ số câu hỏi]: chỉ số đáp án }. Trả về tổng điểm và số câu đã trả lời. */
export function scoreSurvey(questions, answers = {}) {
  let total = 0;
  let answered = 0;
  questions.forEach((q, qi) => {
    const ai = answers[qi];
    if (Number.isInteger(ai) && ai >= 0 && ai < q.options.length) {
      total += q.options[ai].score;
      answered += 1;
    }
  });
  return { total, answered, questions: questions.length, complete: answered === questions.length };
}

/** Ngưỡng theo công thức A59 của sheet (tổng điểm 6–17 / 18–27 / còn lại). */
export function riskResult(total) {
  if (total > 5 && total < 18) return { level: 'low', text: 'Bạn là người ngại rủi ro, bạn nên duy trì các tài sản rủi ro tại mức thấp' };
  if (total > 17 && total < 28) return { level: 'medium', text: 'Bạn là người trung lập với rủi ro, bạn nên duy trì các tài sản rủi ro tại mức trung bình' };
  return { level: 'high', text: 'Bạn là người chấp nhận rủi ro, bạn có thể gia tăng tỷ trọng các tài sản có mức độ rủi ro cao' };
}

/** Ngưỡng theo công thức A126 (11–20 / 21–29 / 30–38 / 39–41 / còn lại). */
export function circumstanceResult(total) {
  const tail = 'để phát triển tài chính của bạn trong dài hạn';
  if (total > 10 && total < 21) return { level: 1, text: `Bạn trong điều kiện không thuận lợi ${tail}` };
  if (total > 20 && total < 30) return { level: 2, text: `Bạn trong điều kiện ít thuận lợi ${tail}` };
  if (total > 29 && total < 39) return { level: 3, text: `Bạn trong điều kiện bình thường ${tail}` };
  if (total > 38 && total < 42) return { level: 4, text: `Bạn trong điều kiện thuận lợi ${tail}` };
  return { level: 5, text: `Bạn trong điều kiện cực kỳ thuận lợi ${tail}` };
}

/** Kết luận chỉ đưa ra khi đã trả lời đủ; chưa đủ thì báo thiếu thay vì suy ra từ điểm thiếu. */
export function surveyOutcome(kind, answers) {
  const questions = kind === 'risk' ? RISK_SURVEY : CIRCUMSTANCE_SURVEY;
  const s = scoreSurvey(questions, answers);
  if (!s.complete) return { ...s, result: null };
  return { ...s, result: kind === 'risk' ? riskResult(s.total) : circumstanceResult(s.total) };
}
