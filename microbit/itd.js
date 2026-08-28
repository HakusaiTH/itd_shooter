/**
 * ITD Space Shooter - micro:bit 5-Lane Grid Index Controller
 * 
 * 📌 วิธีใช้งาน (How to Use):
 * 1. เปิดเว็บไซต์ https://makecode.microbit.org/
 * 2. สร้างโครงการใหม่ (New Project) และเปลี่ยนโหมดเป็น "JavaScript" (มุมบนกลาง)
 * 3. คัดลอกโค้ดนี้ทั้งหมดไปวางใน MakeCode
 * 4. กดปุ่ม "Download" / "Flash" เพื่อแฟลชโค้ดลงบอร์ด micro:bit (รองรับทั้ง v1 และ v2)
 * 5. เสียบสาย USB micro:bit เข้ากับคอมพิวเตอร์
 * 6. เปิดเกม ITD Space Shooter ในเบราว์เซอร์ (Chrome / Edge)
 * 7. กดปุ่ม "🔌 Connect micro:bit" ในหน้าเกมเพื่อเชื่อมต่อผ่าน Serial Port
 * 
 * 🎮 การควบคุมระบบ Grid Index (5 เลน):
 * - 🔘 ปุ่ม A: เลื่อนช่องไปทางซ้าย (Grid Index 0, 1, 2, 3, 4)
 * - 🔘 ปุ่ม B: เลื่อนช่องไปทางขวา (Grid Index 0, 1, 2, 3, 4)
 * - 🔘 ปุ่ม A + B พร้อมกัน: หยุดเกม / เล่นต่อ (Pause / Resume)
 * - 💡 หน้าจอ LED 5 ช่องบน micro:bit จะแสดงตำแหน่งคอลัมน์ Index ปัจจุบันตรงกับหน้าจอ!
 */

// 1. ตั้งค่าการเชื่อมต่อ Serial Port ผ่าน USB (Baud rate 115200)
serial.redirectToUSB()
serial.setBaudRate(BaudRate.BaudRate115200)

// 2. แสดงไอคอนต้อนรับเมื่อเริ่มต้นระบบ
basic.showIcon(IconNames.Target)
basic.pause(400)
basic.clearScreen()

let gridIndex = 2 // ตำแหน่งเริ่มต้น: เลนตรงกลาง (Index 2 จาก 0, 1, 2, 3, 4)
let lastA = false
let lastB = false

// ฟังก์ชันอัปเดตไฟ LED 5 ช่องบน micro:bit
function updateLED() {
    basic.clearScreen()
    // แสดงเส้นไฟ LED แนวตั้งตามคอลัมน์ Grid Index ปัจจุบัน (0 ถึง 4)
    led.plot(gridIndex, 1)
    led.plot(gridIndex, 2)
    led.plot(gridIndex, 3)
}

// ส่งค่า Grid Index เริ่มต้นเมื่อต่อระบบ
serial.writeLine(gridIndex.toString())
updateLED()

// 3. วนลูปอ่านการกดปุ่มแบบ Grid Index
basic.forever(function () {
    let currentA = input.buttonIsPressed(Button.A)
    let currentB = input.buttonIsPressed(Button.B)

    if (currentA && currentB) {
        if (!lastA || !lastB) {
            serial.writeLine("PAUSE")
            basic.showIcon(IconNames.No)
            basic.pause(250)
            updateLED()
        }
    } else if (currentA && !lastA) {
        // กดปุ่ม A -> ลด Grid Index ลง 1 ช่อง (ซ้ายสุดที่ Index 0)
        if (gridIndex > 0) {
            gridIndex -= 1
            serial.writeLine(gridIndex.toString())
            updateLED()
        }
    } else if (currentB && !lastB) {
        // กดปุ่ม B -> เพิ่ม Grid Index ขึ้น 1 ช่อง (ขวาสุดที่ Index 4)
        if (gridIndex < 4) {
            gridIndex += 1
            serial.writeLine(gridIndex.toString())
            updateLED()
        }
    }

    lastA = currentA
    lastB = currentB
    basic.pause(20)
})
