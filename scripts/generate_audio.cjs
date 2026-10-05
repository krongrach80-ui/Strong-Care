const fs = require('fs');
const path = require('path');
const https = require('https');

const outputDir = path.join(__dirname, '..', 'frontend', 'public', 'sounds');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const phrases = {
  'welcome.mp3': 'สวัสดีครับ ยินดีต้อนรับเข้าสู่ระบบกายภาพบำบัด PhysioVision กรุณาสแกนใบหน้าเพื่อเข้าสู่ระบบ หรือเลือกเริ่มฝึกกายภาพได้เลยครับ',
  'face_look.mp3': 'กรุณามองกล้องเพื่อเข้าสู่ระบบครับ',
  'face_align_hold.mp3': 'จัดใบหน้าตรงแล้วครับ อยู่นิ่งๆ สามวินาทีนะครับ',
  'face_look_straight.mp3': 'กรุณามองตรงมาที่กล้องครับ',
  'face_turn_left.mp3': 'ดีมากครับ กรุณาขยับใบหน้าไปทางซ้ายเล็กน้อยครับ',
  'face_turn_right.mp3': 'ดีมากครับ ตอนนี้ขยับใบหน้าไปทางขวาเล็กน้อยครับ',
  'face_face_angles_done.mp3': 'บันทึกมุมใบหน้าครบแล้วครับ กรอกเพียงชื่อและอายุเพื่อเสร็จสิ้นครับ',
  'face_saving.mp3': 'กำลังบันทึกข้อมูลใบหน้าครับ',
  'face_enrolled.mp3': 'สมัครสมาชิกเรียบร้อยแล้วครับ ยินดีต้อนรับเข้าสู่ระบบครับ',
  'welcome_back.mp3': 'สวัสดีครับ ยินดีต้อนรับกลับมาครับ',
  'workout_start.mp3': 'เริ่มการฝึกกายภาพได้เลยครับ จัดท่าทางให้พร้อมนะครับ',
  'good_form.mp3': 'ดีมากครับ ทำได้ถูกต้องครับ',
  'raise_arm.mp3': 'ยกแขนขึ้นอีกเล็กน้อยครับ',
  'squat_more.mp3': 'ย่อเข่าลงอีกเล็กน้อยครับ',
  'leg_more.mp3': 'ยกขาขึ้นอีกเล็กน้อยครับ',
  'slow_down.mp3': 'ค่อย ๆ ยกนะครับ อย่ารีบครับ',
  'adjust_posture.mp3': 'กรุณาปรับท่าทางก่อนครับ ตัวตรงนะครับ',
  'hold_pose.mp3': 'ดีมากครับ ค้างท่าไว้นิ่งๆ ครับ',
  'workout_complete.mp3': 'ยอดเยี่ยมครับ วันนี้ทำครบตามเป้าหมายแล้วครับ',
  'guide_home.mp3': 'สวัสดีครับ ยินดีต้อนรับเข้าสู่ระบบกายภาพบำบัดฟิสิโอวิชั่น คุณสามารถกดปุ่มเริ่มทำกายภาพ หรือกดปุ่มสแกนใบหน้าด้านบนเพื่อเข้าสู่ระบบครับ',
  'guide_training.mp3': 'หน้านี้สำหรับการฝึกกายภาพบำบัดพร้อมกล้องตรวจจับท่าทาง กรุณาจัดลำตัวให้อยู่ในกรอบกล้อง และเริ่มเคลื่อนไหวตามคำแนะนำได้เลยครับ',
  'guide_exercises.mp3': 'หน้านี้รวบรวมโปรแกรมกายภาพบำบัดทั้งหมด เช่น ท่ายกแขน ท่าย่อเข่า และท่ายกขา กรุณาเลือกท่าที่ต้องการเริ่มฝึกได้ทันทีครับ',
  'guide_history.mp3': 'หน้านี้คือประวัติการฝึกซ้อมทั้งหมด บันทึกวันเวลา จำนวนครั้ง และความถูกต้องย้อนหลังครับ',
  'guide_patients.mp3': 'หน้านี้สำหรับจัดการข้อมูลผู้ป่วย คุณสามารถลงทะเบียนผู้ป่วยใหม่ด้วยใบหน้า หรือเลือกผู้ป่วยได้ครับ',
  'guide_result.mp3': 'หน้านี้สรุปผลการออกกำลังกายกายภาพบำบัดของคุณ แสดงจำนวนครั้งที่ทำสำเร็จและความถูกต้องของสรีระครับ',
  'test_voice.mp3': 'สวัสดีครับ นี่คือเสียงจำลองระบบแนะนำอัตโนมัติของฟิสิโอวิชั่นครับ',
};

// Add reps 1 to 20
for (let i = 1; i <= 20; i++) {
  phrases[`rep_${i}.mp3`] = `ดีมากครับ ครบ ${i} ครั้งแล้วครับ`;
}

function downloadTts(filename, text) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(outputDir, filename);
    if (fs.existsSync(filePath) && fs.statSync(filePath).size > 1000) {
      console.log(`[Cached] ${filename}`);
      return resolve();
    }

    const encoded = encodeURIComponent(text);
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=th&client=tw-ob`;

    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    };

    https.get(url, options, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download ${filename}: status ${res.statusCode}`));
      }

      const file = fs.createWriteStream(filePath);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`[Downloaded] ${filename} (${fs.statSync(filePath).size} bytes)`);
        resolve();
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function run() {
  console.log(`Generating ${Object.keys(phrases).length} Thai voice audio files in ${outputDir}...`);
  for (const [filename, text] of Object.entries(phrases)) {
    try {
      await downloadTts(filename, text);
      // Small pause to be polite
      await new Promise((r) => setTimeout(r, 200));
    } catch (err) {
      console.error(`Error for ${filename}:`, err.message);
    }
  }
  console.log('Finished generating Thai audio files!');
}

run();
