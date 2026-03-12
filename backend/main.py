from flask import Flask, request, jsonify, session
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import os
from datetime import datetime, date
from functools import wraps

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
CORS(app, supports_credentials=True)

# Database path
DB_PATH = '/tmp/attendance.db'

def get_db():
    """Get database connection."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize the database with tables and sample data."""
    conn = get_db()
    cursor = conn.cursor()
    
    # Create teachers table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS teachers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            is_admin INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create departments table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS departments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            code TEXT UNIQUE NOT NULL
        )
    ''')
    
    # Create students table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            roll_number TEXT NOT NULL,
            name TEXT NOT NULL,
            department_id INTEGER,
            year TEXT NOT NULL,
            division TEXT NOT NULL,
            parent_phone TEXT,
            email TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (department_id) REFERENCES departments(id)
        )
    ''')
    
    # Create attendance table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            date DATE NOT NULL,
            status TEXT NOT NULL CHECK(status IN ('Present', 'Absent')),
            marked_by INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (student_id) REFERENCES students(id),
            FOREIGN KEY (marked_by) REFERENCES teachers(id),
            UNIQUE(student_id, date)
        )
    ''')
    
    # Create notifications log table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            message TEXT NOT NULL,
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            status TEXT DEFAULT 'pending',
            FOREIGN KEY (student_id) REFERENCES students(id)
        )
    ''')
    
    # Check if data already exists
    cursor.execute('SELECT COUNT(*) FROM departments')
    if cursor.fetchone()[0] == 0:
        # Insert sample departments
        departments = [
            ('Information Technology', 'IT'),
            ('Computer Science', 'CS'),
            ('Electronics', 'EC'),
            ('Mechanical', 'ME')
        ]
        cursor.executemany('INSERT INTO departments (name, code) VALUES (?, ?)', departments)
        
        # Insert sample admin/teacher
        admin_password = generate_password_hash('admin123')
        teacher_password = generate_password_hash('teacher123')
        cursor.execute('INSERT INTO teachers (name, email, password, is_admin) VALUES (?, ?, ?, ?)',
                      ('Admin User', 'admin@college.edu', admin_password, 1))
        cursor.execute('INSERT INTO teachers (name, email, password, is_admin) VALUES (?, ?, ?, ?)',
                      ('John Teacher', 'teacher@college.edu', teacher_password, 0))
        
        # Insert sample students for IT department
        students_it = [
            ('IT001', 'Rahul Sharma', 1, 'FY', 'A', '+919876543210'),
            ('IT002', 'Priya Patel', 1, 'FY', 'A', '+919876543211'),
            ('IT003', 'Amit Kumar', 1, 'FY', 'A', '+919876543212'),
            ('IT004', 'Sneha Gupta', 1, 'FY', 'A', '+919876543213'),
            ('IT005', 'Vikram Singh', 1, 'FY', 'A', '+919876543214'),
            ('IT006', 'Ananya Reddy', 1, 'FY', 'B', '+919876543215'),
            ('IT007', 'Karan Mehta', 1, 'FY', 'B', '+919876543216'),
            ('IT008', 'Pooja Verma', 1, 'FY', 'B', '+919876543217'),
            ('IT009', 'Rohan Das', 1, 'SY', 'A', '+919876543218'),
            ('IT010', 'Neha Joshi', 1, 'SY', 'A', '+919876543219'),
            ('IT011', 'Arjun Nair', 1, 'SY', 'B', '+919876543220'),
            ('IT012', 'Kavya Iyer', 1, 'TY', 'A', '+919876543221'),
            ('IT013', 'Sanjay Rao', 1, 'TY', 'A', '+919876543222'),
            ('IT014', 'Meera Shah', 1, 'BE', 'A', '+919876543223'),
            ('IT015', 'Aditya Kulkarni', 1, 'BE', 'A', '+919876543224'),
        ]
        
        # Insert sample students for CS department
        students_cs = [
            ('CS001', 'Rajesh Kumar', 2, 'FY', 'A', '+919876543225'),
            ('CS002', 'Swati Sharma', 2, 'FY', 'A', '+919876543226'),
            ('CS003', 'Deepak Patel', 2, 'FY', 'B', '+919876543227'),
            ('CS004', 'Anjali Gupta', 2, 'SY', 'A', '+919876543228'),
            ('CS005', 'Manish Singh', 2, 'SY', 'A', '+919876543229'),
            ('CS006', 'Ritu Agarwal', 2, 'TY', 'A', '+919876543230'),
            ('CS007', 'Vivek Mishra', 2, 'BE', 'A', '+919876543231'),
        ]
        
        for student in students_it + students_cs:
            cursor.execute('''
                INSERT INTO students (roll_number, name, department_id, year, division, parent_phone)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', student)
        
        # Insert some sample attendance records
        sample_dates = ['2026-03-01', '2026-03-02', '2026-03-03', '2026-03-04', '2026-03-05',
                       '2026-03-08', '2026-03-09', '2026-03-10']
        
        cursor.execute('SELECT id FROM students')
        student_ids = [row[0] for row in cursor.fetchall()]
        
        import random
        for student_id in student_ids:
            for date_str in sample_dates:
                status = 'Present' if random.random() > 0.25 else 'Absent'
                try:
                    cursor.execute('''
                        INSERT INTO attendance (student_id, date, status, marked_by)
                        VALUES (?, ?, ?, 1)
                    ''', (student_id, date_str, status))
                except:
                    pass
    
    conn.commit()
    conn.close()

# Initialize database on startup
init_db()

def login_required(f):
    """Decorator to require login for routes."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'Authorization required'}), 401
        
        # Simple token validation (in production, use JWT)
        try:
            token_parts = auth_header.split(':')
            if len(token_parts) != 2:
                return jsonify({'error': 'Invalid token format'}), 401
            
            teacher_id = int(token_parts[0])
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM teachers WHERE id = ?', (teacher_id,))
            teacher = cursor.fetchone()
            conn.close()
            
            if not teacher:
                return jsonify({'error': 'Invalid token'}), 401
            
            request.teacher = dict(teacher)
        except:
            return jsonify({'error': 'Invalid token'}), 401
        
        return f(*args, **kwargs)
    return decorated_function

# Health check
@app.get("/health")
def health():
    return {"status": "ok", "message": "Student Attendance System API is running"}

# Authentication routes
@app.post("/auth/login")
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM teachers WHERE email = ?', (email,))
    teacher = cursor.fetchone()
    conn.close()
    
    if not teacher or not check_password_hash(teacher['password'], password):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    # Simple token (in production, use JWT)
    token = f"{teacher['id']}:{teacher['email']}"
    
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': {
            'id': teacher['id'],
            'name': teacher['name'],
            'email': teacher['email'],
            'is_admin': bool(teacher['is_admin'])
        }
    })

@app.get("/auth/me")
@login_required
def get_current_user():
    return jsonify({
        'id': request.teacher['id'],
        'name': request.teacher['name'],
        'email': request.teacher['email'],
        'is_admin': bool(request.teacher['is_admin'])
    })

# Department routes
@app.get("/departments")
@login_required
def get_departments():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM departments ORDER BY name')
    departments = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify(departments)

# Student routes
@app.get("/students")
@login_required
def get_students():
    department_id = request.args.get('department_id')
    year = request.args.get('year')
    division = request.args.get('division')
    
    conn = get_db()
    cursor = conn.cursor()
    
    query = '''
        SELECT s.*, d.name as department_name, d.code as department_code
        FROM students s
        JOIN departments d ON s.department_id = d.id
        WHERE 1=1
    '''
    params = []
    
    if department_id:
        query += ' AND s.department_id = ?'
        params.append(department_id)
    if year:
        query += ' AND s.year = ?'
        params.append(year)
    if division:
        query += ' AND s.division = ?'
        params.append(division)
    
    query += ' ORDER BY s.roll_number'
    
    cursor.execute(query, params)
    students = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify(students)

@app.get("/students/<int:student_id>/attendance")
@login_required
def get_student_attendance(student_id):
    conn = get_db()
    cursor = conn.cursor()
    
    # Get student info
    cursor.execute('''
        SELECT s.*, d.name as department_name
        FROM students s
        JOIN departments d ON s.department_id = d.id
        WHERE s.id = ?
    ''', (student_id,))
    student = cursor.fetchone()
    
    if not student:
        conn.close()
        return jsonify({'error': 'Student not found'}), 404
    
    # Get attendance records
    cursor.execute('''
        SELECT date, status FROM attendance
        WHERE student_id = ?
        ORDER BY date DESC
    ''', (student_id,))
    records = [dict(row) for row in cursor.fetchall()]
    
    # Calculate percentage
    total = len(records)
    present = sum(1 for r in records if r['status'] == 'Present')
    percentage = (present / total * 100) if total > 0 else 0
    
    conn.close()
    
    return jsonify({
        'student': dict(student),
        'records': records,
        'total_days': total,
        'present_days': present,
        'absent_days': total - present,
        'percentage': round(percentage, 2)
    })

# Attendance routes
@app.get("/attendance")
@login_required
def get_attendance():
    date_str = request.args.get('date', date.today().isoformat())
    department_id = request.args.get('department_id')
    year = request.args.get('year')
    division = request.args.get('division')
    
    conn = get_db()
    cursor = conn.cursor()
    
    query = '''
        SELECT s.id, s.roll_number, s.name, s.parent_phone,
               d.name as department_name, s.year, s.division,
               a.status, a.date
        FROM students s
        JOIN departments d ON s.department_id = d.id
        LEFT JOIN attendance a ON s.id = a.student_id AND a.date = ?
        WHERE 1=1
    '''
    params = [date_str]
    
    if department_id:
        query += ' AND s.department_id = ?'
        params.append(department_id)
    if year:
        query += ' AND s.year = ?'
        params.append(year)
    if division:
        query += ' AND s.division = ?'
        params.append(division)
    
    query += ' ORDER BY s.roll_number'
    
    cursor.execute(query, params)
    attendance = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify(attendance)

@app.post("/attendance")
@login_required
def submit_attendance():
    data = request.get_json()
    date_str = data.get('date', date.today().isoformat())
    records = data.get('records', [])
    
    if not records:
        return jsonify({'error': 'No attendance records provided'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    for record in records:
        student_id = record.get('student_id')
        status = record.get('status')
        
        if not student_id or not status:
            continue
        
        # Upsert attendance record
        cursor.execute('''
            INSERT INTO attendance (student_id, date, status, marked_by)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(student_id, date)
            DO UPDATE SET status = ?, marked_by = ?
        ''', (student_id, date_str, status, request.teacher['id'], status, request.teacher['id']))
    
    conn.commit()
    
    # Check for low attendance and create notifications
    low_attendance_students = check_low_attendance(cursor)
    
    conn.close()
    
    return jsonify({
        'message': 'Attendance submitted successfully',
        'count': len(records),
        'low_attendance_alerts': low_attendance_students
    })

def check_low_attendance(cursor):
    """Check for students with attendance below 75% and create notifications."""
    cursor.execute('''
        SELECT s.id, s.name, s.roll_number, s.parent_phone, d.name as department_name,
               COUNT(a.id) as total_days,
               SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as present_days
        FROM students s
        JOIN departments d ON s.department_id = d.id
        LEFT JOIN attendance a ON s.id = a.student_id
        GROUP BY s.id
        HAVING total_days >= 5
    ''')
    
    low_attendance = []
    for row in cursor.fetchall():
        total = row['total_days']
        present = row['present_days'] or 0
        percentage = (present / total * 100) if total > 0 else 0
        
        if percentage < 75:
            low_attendance.append({
                'student_id': row['id'],
                'name': row['name'],
                'roll_number': row['roll_number'],
                'parent_phone': row['parent_phone'],
                'department': row['department_name'],
                'percentage': round(percentage, 2)
            })
            
            # Log notification
            message = f"Low attendance alert: {row['name']} ({row['roll_number']}) has {round(percentage, 2)}% attendance"
            cursor.execute('''
                INSERT INTO notifications (student_id, message, status)
                VALUES (?, ?, 'pending')
            ''', (row['id'], message))
    
    return low_attendance

# Admin dashboard routes
@app.get("/admin/stats")
@login_required
def get_admin_stats():
    conn = get_db()
    cursor = conn.cursor()
    
    # Get total students
    cursor.execute('SELECT COUNT(*) as count FROM students')
    total_students = cursor.fetchone()['count']
    
    # Get today's attendance stats
    today = date.today().isoformat()
    cursor.execute('''
        SELECT 
            COUNT(CASE WHEN status = 'Present' THEN 1 END) as present,
            COUNT(CASE WHEN status = 'Absent' THEN 1 END) as absent
        FROM attendance
        WHERE date = ?
    ''', (today,))
    today_stats = cursor.fetchone()
    present_today = today_stats['present'] or 0
    absent_today = today_stats['absent'] or 0
    
    # Get department-wise stats
    cursor.execute('''
        SELECT d.name, d.code, COUNT(s.id) as student_count
        FROM departments d
        LEFT JOIN students s ON d.id = s.department_id
        GROUP BY d.id
    ''')
    department_stats = [dict(row) for row in cursor.fetchall()]
    
    # Get year-wise distribution
    cursor.execute('''
        SELECT year, COUNT(*) as count
        FROM students
        GROUP BY year
        ORDER BY 
            CASE year
                WHEN 'FY' THEN 1
                WHEN 'SY' THEN 2
                WHEN 'TY' THEN 3
                WHEN 'BE' THEN 4
            END
    ''')
    year_stats = [dict(row) for row in cursor.fetchall()]
    
    # Get overall attendance percentage
    cursor.execute('''
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'Present' THEN 1 ELSE 0 END) as present
        FROM attendance
    ''')
    overall = cursor.fetchone()
    overall_percentage = (overall['present'] / overall['total'] * 100) if overall['total'] > 0 else 0
    
    # Get low attendance students
    cursor.execute('''
        SELECT s.id, s.name, s.roll_number, s.parent_phone, d.name as department_name,
               s.year, s.division,
               COUNT(a.id) as total_days,
               SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as present_days
        FROM students s
        JOIN departments d ON s.department_id = d.id
        LEFT JOIN attendance a ON s.id = a.student_id
        GROUP BY s.id
        HAVING total_days >= 1
    ''')
    
    low_attendance_students = []
    for row in cursor.fetchall():
        total = row['total_days']
        present = row['present_days'] or 0
        percentage = (present / total * 100) if total > 0 else 0
        
        if percentage < 75:
            low_attendance_students.append({
                'id': row['id'],
                'name': row['name'],
                'roll_number': row['roll_number'],
                'parent_phone': row['parent_phone'],
                'department': row['department_name'],
                'year': row['year'],
                'division': row['division'],
                'total_days': total,
                'present_days': present,
                'percentage': round(percentage, 2)
            })
    
    # Get recent notifications
    cursor.execute('''
        SELECT n.*, s.name as student_name, s.roll_number
        FROM notifications n
        JOIN students s ON n.student_id = s.id
        ORDER BY n.sent_at DESC
        LIMIT 10
    ''')
    recent_notifications = [dict(row) for row in cursor.fetchall()]
    
    conn.close()
    
    return jsonify({
        'total_students': total_students,
        'present_today': present_today,
        'absent_today': absent_today,
        'not_marked_today': total_students - present_today - absent_today,
        'department_stats': department_stats,
        'year_stats': year_stats,
        'overall_attendance_percentage': round(overall_percentage, 2),
        'low_attendance_students': low_attendance_students,
        'recent_notifications': recent_notifications
    })

@app.get("/admin/attendance-trend")
@login_required
def get_attendance_trend():
    days = int(request.args.get('days', 7))
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT date,
               COUNT(CASE WHEN status = 'Present' THEN 1 END) as present,
               COUNT(CASE WHEN status = 'Absent' THEN 1 END) as absent
        FROM attendance
        GROUP BY date
        ORDER BY date DESC
        LIMIT ?
    ''', (days,))
    
    trend = [dict(row) for row in cursor.fetchall()]
    trend.reverse()  # Oldest to newest
    
    conn.close()
    
    return jsonify(trend)

# WhatsApp notification endpoint (simulated)
@app.post("/notifications/send-whatsapp")
@login_required
def send_whatsapp_notification():
    data = request.get_json()
    student_id = data.get('student_id')
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Get student and attendance info
    cursor.execute('''
        SELECT s.*, d.name as department_name,
               COUNT(a.id) as total_days,
               SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as present_days
        FROM students s
        JOIN departments d ON s.department_id = d.id
        LEFT JOIN attendance a ON s.id = a.student_id
        WHERE s.id = ?
        GROUP BY s.id
    ''', (student_id,))
    
    student = cursor.fetchone()
    if not student:
        conn.close()
        return jsonify({'error': 'Student not found'}), 404
    
    total = student['total_days']
    present = student['present_days'] or 0
    percentage = (present / total * 100) if total > 0 else 0
    
    # Create notification message
    message = f"""
    Dear Parent,
    
    This is to inform you that your ward {student['name']} (Roll No: {student['roll_number']}) 
    from {student['department_name']} Department, {student['year']}-{student['division']} 
    has attendance of {round(percentage, 2)}%, which is below the required 75%.
    
    Please ensure regular attendance.
    
    Regards,
    College Administration
    """
    
    # Log the notification (in production, this would send actual WhatsApp message using PyWhatKit)
    cursor.execute('''
        INSERT INTO notifications (student_id, message, status)
        VALUES (?, ?, 'sent')
    ''', (student_id, message.strip()))
    
    conn.commit()
    conn.close()
    
    return jsonify({
        'message': 'Notification sent successfully',
        'phone': student['parent_phone'],
        'notification_message': message.strip(),
        'note': 'In production, this would send an actual WhatsApp message using PyWhatKit'
    })

@app.post("/notifications/send-bulk")
@login_required
def send_bulk_notifications():
    """Send notifications to all students with attendance below 75%."""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT s.id, s.name, s.roll_number, s.parent_phone, d.name as department_name,
               s.year, s.division,
               COUNT(a.id) as total_days,
               SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) as present_days
        FROM students s
        JOIN departments d ON s.department_id = d.id
        LEFT JOIN attendance a ON s.id = a.student_id
        GROUP BY s.id
        HAVING total_days >= 1
    ''')
    
    sent_count = 0
    for row in cursor.fetchall():
        total = row['total_days']
        present = row['present_days'] or 0
        percentage = (present / total * 100) if total > 0 else 0
        
        if percentage < 75:
            message = f"Low attendance alert: {row['name']} ({row['roll_number']}) has {round(percentage, 2)}% attendance"
            cursor.execute('''
                INSERT INTO notifications (student_id, message, status)
                VALUES (?, ?, 'sent')
            ''', (row['id'], message))
            sent_count += 1
    
    conn.commit()
    conn.close()
    
    return jsonify({
        'message': f'Sent notifications to {sent_count} students with low attendance',
        'count': sent_count
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
