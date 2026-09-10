{/* วางเพิ่มก่อนช่อง 'รายละเอียดสิ่งที่ทำ' */}
<div>
  <label className="label" htmlFor="studentPhoto">
    รูปถ่ายหน้าตรงของนักศึกษา (URL รูปภาพ)
  </label>
  <input
    id="studentPhoto"
    name="studentPhoto"
    type="url"
    className="input"
    placeholder="https://example.com/my-face.jpg หรือ วางลิงก์รูปหน้าตรง"
  />
  <p className="mt-1 text-xs text-slate-400">
    ใส่ลิงก์รูปหน้าตรงเพื่อให้ระบบนำไปแสดงที่หน้าตรวจของอาจารย์
  </p>
</div>