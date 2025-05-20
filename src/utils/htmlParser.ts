/**
 * Chuyển đổi HTML thành text có định dạng
 * @param htmlString Chuỗi HTML cần parse
 * @returns Chuỗi đã được xử lý
 */
export const parseHtmlContent = (htmlString: string): string => {
  if (!htmlString) return '';

  // Loại bỏ các class attrs
  let result = htmlString.replace(/class="[^"]*"/g, '');

  // Thay thẻ paragraph bằng 2 dòng mới
  result = result.replace(/<\/p>/g, '\n\n');
  
  // Thay thẻ list item bằng bullet
  result = result.replace(/<li[^>]*>/g, '\n• ');
  
  // Loại bỏ các thẻ HTML khác
  result = result.replace(/<[^>]*>/g, '');
  
  // Xử lý khoảng trắng và ngắt dòng
  result = result.replace(/\n\s*\n/g, '\n\n');
  result = result.replace(/^\s+|\s+$/g, '');
  
  // Decode HTML entities
  result = result.replace(/&nbsp;/g, ' ');
  result = result.replace(/&amp;/g, '&');
  result = result.replace(/&lt;/g, '<');
  result = result.replace(/&gt;/g, '>');
  result = result.replace(/&quot;/g, '"');
  result = result.replace(/&#39;/g, "'");
  
  return result;
};
