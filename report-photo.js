// Re-encode pixels only: never persist the source filename or EXIF/GPS metadata.
window.validReportPhoto = value => typeof value === 'string' && value.length <= 1400000 && /^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(value);
window.prepareReportPhoto = async file => {
  if (!['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('JPG·PNG·WEBP 사진을 선택해 주세요. HEIC는 JPG로 변환해 주세요.');
  if (!file.size || file.size > 15*1024*1024) throw new Error('사진은 15MB 이하로 선택해 주세요.');
  const url=URL.createObjectURL(file), image=new Image();
  try {
    await new Promise((resolve,reject)=>{ image.onload=resolve; image.onerror=()=>reject(new Error('사진을 읽지 못했어요. 다른 사진을 선택해 주세요.')); image.src=url; });
    const width=image.naturalWidth,height=image.naturalHeight;
    if(!width || !height || width*height>60000000) throw new Error('사진 해상도가 너무 커요. 6천만 화소 이하 사진을 선택해 주세요.');
    const scale=Math.min(1,2000/Math.max(width,height)), canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(width*scale)); canvas.height=Math.max(1,Math.round(height*scale));
    const ctx=canvas.getContext('2d'); if(!ctx) throw new Error('사진을 처리할 수 없어요. 다른 브라우저에서 시도해 주세요.');
    ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);
    for(const quality of [.88,.78,.68,.58]) {const result=canvas.toDataURL('image/jpeg',quality);if(window.validReportPhoto(result)) return result;}
    throw new Error('사진 용량을 줄이지 못했어요. 표시판 부분만 잘라 다시 올려주세요.');
  } finally { URL.revokeObjectURL(url); }
};
