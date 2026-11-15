import { dich } from './dich.js';

// Các đường dẫn dùng số thứ tự từ 1 như phần người học nhìn thấy. Để nguyên
// hàm dựng cảnh, ID thao tác, đáp án đúng và công thức KaTeX của tác giả.
const TRUONG_BUOC = { ten: true, noiDung: true, thuThach: { de: true, goiY: true } };
const TRUONG_THUAT_NGU = { vi: true, nghia: true };
const TRUONG_BAI = {
  ten: true, moTa: true, yChinh: true, giaiThich: true, conSo: true, hieuDung: true, nguon: true,
  baiGiang: {
    mucTieu: true, buoc: TRUONG_BUOC, congThuc: { ten: true, y: true },
    cauHoi: { hoi: true, chon: true, giai: true, dap: true },
    docThem: true, thuatNgu: TRUONG_THUAT_NGU,
  },
};

function doiChu(goc, truong, khoa, phamVi, tra) {
  if (Array.isArray(goc)) {
    return goc.map((giaTri, i) => doiChu(giaTri, truong, khoa + '.' + (i + 1), phamVi, tra));
  }
  if (typeof goc === 'string' && truong === true) return tra(phamVi, khoa, goc);
  if (!goc || typeof goc !== 'object' || truong === true) return goc;

  const ketQua = { ...goc };
  for (const [ten, con] of Object.entries(truong)) {
    if (!(ten in goc)) continue;
    // {{thuật ngữ}} trong bản Việt và tất cả bản dịch dùng cùng khoá tra.
    const dichRa = truong === TRUONG_THUAT_NGU && ten === 'vi' ? 'hienThi' : ten;
    ketQua[dichRa] = doiChu(goc[ten], con, khoa + '.' + ten, phamVi, tra);
  }
  return ketQua;
}

export function dichBai(canh, tra = dich) {
  return doiChu(canh, TRUONG_BAI, 'bai', canh.id, tra);
}

export function dichPhan(phan, index, tra = dich) {
  return doiChu(phan, { ten: true, moTa: true }, 'phan.' + (index + 1), 'chung', tra);
}

export function dichThuatNguChung(ds, tra = dich) {
  return doiChu(ds, TRUONG_THUAT_NGU, 'thuatNgu', 'chung', tra);
}
