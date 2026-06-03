"""
Database seed script: creates initial users, courses, branches, fee structures,
students, payments, and expenses for development and testing.
"""
import random
from datetime import date, timedelta
from decimal import Decimal

from app.database import SessionLocal, engine, Base
from app.utils.security import get_password_hash
from app.models.user import User, UserRole
from app.models.course import Course, Branch
from app.models.student import Student, StudentStatus, StudentCategory
from app.models.fee import FeeStructure, StudentFee, FeeStatus
from app.models.payment import Payment, PaymentMode, PaymentStatus
from app.models.expense import Expense, ExpenseCategory
from app.models.settings import CollegeSettings


def seed_database():
    """Seed the database with initial data."""
    db = SessionLocal()
    try:
        # Check if data already exists
        existing_users = db.query(User).count()
        if existing_users > 0:
            print("Database already seeded. Skipping.")
            return

        print("Seeding database...")

        # ──────────────────────────────────────────────────────
        # 1. Create Users
        # ──────────────────────────────────────────────────────
        users_data = [
            {
                "username": "superadmin",
                "email": "superadmin@nit.edu.in",
                "full_name": "Super Administrator",
                "role": UserRole.super_admin,
            },
            {
                "username": "admin",
                "email": "admin@nit.edu.in",
                "full_name": "College Administrator",
                "role": UserRole.admin,
            },
            {
                "username": "accountant",
                "email": "accountant@nit.edu.in",
                "full_name": "Main Accountant",
                "role": UserRole.accountant,
            },
            {
                "username": "clerk",
                "email": "clerk@nit.edu.in",
                "full_name": "Office Clerk",
                "role": UserRole.clerk,
            },
            {
                "username": "auditor",
                "email": "auditor@nit.edu.in",
                "full_name": "Internal Auditor",
                "role": UserRole.auditor,
            },
        ]

        users = []
        for ud in users_data:
            # Generate a strong default password based on username
            strong_password = f"{ud['username'].capitalize()}@123!"
            hashed_pw = get_password_hash(strong_password)
            user = User(
                username=ud["username"],
                email=ud["email"],
                hashed_password=hashed_pw,
                full_name=ud["full_name"],
                role=ud["role"],
                is_active=True,
            )
            db.add(user)
            users.append(user)

        db.flush()
        print(f"  Created {len(users)} users.")

        # ──────────────────────────────────────────────────────
        # 2. Create College Settings
        # ──────────────────────────────────────────────────────
        college_settings = CollegeSettings(
            id=1,
            college_name="National Institute of Technology",
            address="Main Campus Road, Bangalore - 560001",
            phone="+91-80-2658-1234",
            email="accounts@nit.edu.in",
            academic_year="2025-2026",
            receipt_prefix="NIT",
            receipt_counter=0,
        )
        db.add(college_settings)
        db.flush()
        print("  Created college settings.")

        # ──────────────────────────────────────────────────────
        # 3. Create Courses
        # ──────────────────────────────────────────────────────
        courses_data = [
            {"name": "B.Tech", "code": "BTECH", "duration_years": 4},
            {"name": "M.Tech", "code": "MTECH", "duration_years": 2},
            {"name": "BCA", "code": "BCA", "duration_years": 3},
            {"name": "MCA", "code": "MCA", "duration_years": 2},
            {"name": "MBA", "code": "MBA", "duration_years": 2},
        ]

        courses = {}
        for cd in courses_data:
            course = Course(
                name=cd["name"],
                code=cd["code"],
                duration_years=cd["duration_years"],
                is_active=True,
            )
            db.add(course)
            db.flush()
            courses[cd["code"]] = course

        print(f"  Created {len(courses)} courses.")

        # ──────────────────────────────────────────────────────
        # 4. Create Branches
        # ──────────────────────────────────────────────────────
        branches_data = {
            "BTECH": ["CSE", "ECE", "ME", "CE", "EE"],
            "MTECH": ["CSE", "ECE"],
            "BCA": [],
            "MCA": [],
            "MBA": ["Finance", "Marketing", "HR"],
        }

        branches = {}
        for course_code, branch_names in branches_data.items():
            course = courses[course_code]
            for bn in branch_names:
                branch = Branch(
                    name=bn,
                    course_id=course.id,
                    is_active=True,
                )
                db.add(branch)
                db.flush()
                branches[f"{course_code}_{bn}"] = branch

        total_branches = sum(len(v) for v in branches_data.values())
        print(f"  Created {total_branches} branches.")

        # ──────────────────────────────────────────────────────
        # 5. Create Fee Structures
        # ──────────────────────────────────────────────────────
        cse_branch = branches.get("BTECH_CSE")
        fee_structures = []

        for semester in [1, 2]:
            fs = FeeStructure(
                course_id=courses["BTECH"].id,
                branch_id=cse_branch.id if cse_branch else None,
                semester=semester,
                batch="2023-2027",
                academic_year="2025-2026",
                tuition_fee=Decimal("75000.00"),
                exam_fee=Decimal("5000.00"),
                library_fee=Decimal("3000.00"),
                hostel_fee=Decimal("25000.00"),
                transport_fee=Decimal("8000.00"),
                lab_fee=Decimal("5000.00"),
                admission_fee=Decimal("10000.00") if semester == 1 else Decimal("0.00"),
                misc_fee=Decimal("2000.00"),
                installment_count=2,
                is_active=True,
            )
            fs.total_amount = fs.compute_total()
            db.add(fs)
            db.flush()
            fee_structures.append(fs)

        # Fee structures for other courses
        other_fee_configs = [
            {"code": "BTECH", "branch_key": "BTECH_ECE", "tuition": 72000, "semester": 1},
            {"code": "BTECH", "branch_key": "BTECH_ME", "tuition": 70000, "semester": 1},
            {"code": "MTECH", "branch_key": "MTECH_CSE", "tuition": 85000, "semester": 1},
            {"code": "BCA", "branch_key": None, "tuition": 45000, "semester": 1},
            {"code": "MCA", "branch_key": None, "tuition": 55000, "semester": 1},
            {"code": "MBA", "branch_key": "MBA_Finance", "tuition": 95000, "semester": 1},
        ]

        for cfg in other_fee_configs:
            branch_obj = branches.get(cfg["branch_key"]) if cfg["branch_key"] else None
            fs = FeeStructure(
                course_id=courses[cfg["code"]].id,
                branch_id=branch_obj.id if branch_obj else None,
                semester=cfg["semester"],
                batch="2023-2027" if cfg["code"] == "BTECH" else "2024-2026",
                academic_year="2025-2026",
                tuition_fee=Decimal(str(cfg["tuition"])),
                exam_fee=Decimal("5000.00"),
                library_fee=Decimal("3000.00"),
                hostel_fee=Decimal("20000.00"),
                transport_fee=Decimal("7000.00"),
                lab_fee=Decimal("4000.00"),
                admission_fee=Decimal("8000.00"),
                misc_fee=Decimal("2000.00"),
                installment_count=2,
                is_active=True,
            )
            fs.total_amount = fs.compute_total()
            db.add(fs)
            db.flush()
            fee_structures.append(fs)

        print(f"  Created {len(fee_structures)} fee structures.")

        # ──────────────────────────────────────────────────────
        # 6. Create Students
        # ──────────────────────────────────────────────────────
        first_names = [
            "Aarav", "Priya", "Rahul", "Sneha", "Vikram",
            "Ananya", "Arjun", "Kavya", "Rohit", "Deepika",
            "Aditya", "Ishita", "Karan", "Neha", "Siddharth",
            "Pooja", "Manish", "Ritu", "Amit", "Divya",
            "Harsh", "Meera", "Rajesh", "Sakshi", "Vishal",
            "Tanvi", "Gaurav", "Nisha", "Pankaj", "Shreya",
            "Rohan", "Swati", "Nikhil", "Anjali", "Varun",
            "Kriti", "Suresh", "Pallavi", "Tushar", "Sonal",
            "Dev", "Rashmi", "Akash", "Jaya", "Pranav",
            "Mridula", "Vivek", "Bhavna", "Dhruv", "Komal",
        ]

        last_names = [
            "Sharma", "Patel", "Verma", "Gupta", "Singh",
            "Kumar", "Reddy", "Joshi", "Mishra", "Nair",
            "Mehta", "Rao", "Chauhan", "Pandey", "Malhotra",
            "Bhatia", "Kapoor", "Iyer", "Banerjee", "Desai",
            "Agarwal", "Saxena", "Tiwari", "Shah", "Menon",
        ]

        categories = list(StudentCategory)
        statuses_weights = [(StudentStatus.active, 0.85), (StudentStatus.inactive, 0.1), (StudentStatus.alumni, 0.05)]

        # Build student course/branch assignments
        student_assignments = []
        # 20 BTech students
        btech_branches_list = ["CSE", "ECE", "ME", "CE", "EE"]
        for i in range(20):
            br = btech_branches_list[i % len(btech_branches_list)]
            student_assignments.append(("BTECH", br, "2023-2027"))
        # 8 MTech students
        mtech_branches_list = ["CSE", "ECE"]
        for i in range(8):
            br = mtech_branches_list[i % len(mtech_branches_list)]
            student_assignments.append(("MTECH", br, "2024-2026"))
        # 8 BCA students
        for i in range(8):
            student_assignments.append(("BCA", "General", "2023-2026"))
        # 6 MCA students
        for i in range(6):
            student_assignments.append(("MCA", "General", "2024-2026"))
        # 8 MBA students
        mba_branches_list = ["Finance", "Marketing", "HR"]
        for i in range(8):
            br = mba_branches_list[i % len(mba_branches_list)]
            student_assignments.append(("MBA", br, "2024-2026"))

        students = []
        for i in range(50):
            fn = first_names[i]
            ln = last_names[i % len(last_names)]
            course_code, branch_name, batch = student_assignments[i]
            course_obj = courses[course_code]

            # Weighted status selection
            rand = random.random()
            cumulative = 0
            student_status = StudentStatus.active
            for st, w in statuses_weights:
                cumulative += w
                if rand < cumulative:
                    student_status = st
                    break

            student = Student(
                name=f"{fn} {ln}",
                roll_number=f"{course_code}-{batch.split('-')[0]}-{i+1:03d}",
                admission_number=f"ADM-{batch.split('-')[0]}-{i+1:04d}",
                course_id=course_obj.id,
                branch=branch_name,
                semester=random.choice([1, 2, 3, 4]) if course_obj.duration_years >= 4 else random.choice([1, 2]),
                batch=batch,
                phone=f"+91-{random.randint(70000, 99999)}{random.randint(10000, 99999)}",
                email=f"{fn.lower()}.{ln.lower()}@nit.edu.in",
                address=f"{random.randint(1, 999)}, {random.choice(['MG Road', 'Jayanagar', 'Koramangala', 'Indiranagar', 'Whitefield', 'HSR Layout', 'BTM Layout', 'Marathahalli'])}, Bangalore - {random.randint(560001, 560099)}",
                guardian_name=f"{random.choice(['Mr.', 'Mrs.'])} {random.choice(first_names)} {ln}",
                guardian_phone=f"+91-{random.randint(70000, 99999)}{random.randint(10000, 99999)}",
                category=random.choice(categories),
                status=student_status,
            )
            db.add(student)
            students.append(student)

        db.flush()
        print(f"  Created {len(students)} students.")

        # ──────────────────────────────────────────────────────
        # 7. Assign Fees to Students (Create StudentFee records)
        # ──────────────────────────────────────────────────────
        student_fees = []

        # Map fee structures for assignment
        # Assign BTECH CSE sem1 fee to first 4 CSE students
        btech_cse_sem1_fs = fee_structures[0]  # sem 1
        btech_cse_sem2_fs = fee_structures[1]  # sem 2

        for student in students:
            # Find a matching fee structure
            matching_fs = None
            for fs in fee_structures:
                if fs.course_id == student.course_id:
                    matching_fs = fs
                    break

            if matching_fs is None:
                continue

            discount = Decimal("0.00")
            scholarship = Decimal("0.00")

            # Assign some scholarships randomly
            if random.random() < 0.15:
                scholarship = Decimal(str(random.choice([5000, 10000, 15000, 20000, 25000])))
            if random.random() < 0.10:
                discount = Decimal(str(random.choice([2000, 3000, 5000])))

            total = matching_fs.total_amount
            balance = float(total) - float(discount) - float(scholarship)

            sf = StudentFee(
                student_id=student.id,
                fee_structure_id=matching_fs.id,
                total_amount=total,
                paid_amount=Decimal("0.00"),
                discount_amount=discount,
                scholarship_amount=scholarship,
                balance=Decimal(str(balance)),
                status=FeeStatus.pending,
                academic_year=matching_fs.academic_year,
            )
            db.add(sf)
            student_fees.append(sf)

        db.flush()
        print(f"  Created {len(student_fees)} student fee records.")

        # ──────────────────────────────────────────────────────
        # 8. Create Payments
        # ──────────────────────────────────────────────────────
        payment_modes = list(PaymentMode)
        today = date.today()
        six_months_ago = today - timedelta(days=180)
        accountant_user = users[2]  # accountant

        payments_created = []
        receipt_counter = 0

        # Create 100+ payments spread over student fees
        for _ in range(120):
            sf = random.choice(student_fees)
            remaining = float(sf.balance)

            if remaining <= 0:
                # Already fully paid, pick another
                unpaid = [s for s in student_fees if float(s.balance) > 0]
                if not unpaid:
                    break
                sf = random.choice(unpaid)
                remaining = float(sf.balance)

            # Payment amount: partial or full
            if remaining > 20000:
                amount = random.choice([10000, 15000, 20000, 25000, 30000, remaining])
            elif remaining > 5000:
                amount = random.choice([5000, 10000, remaining])
            else:
                amount = remaining

            amount = min(amount, remaining)
            amount = round(amount, 2)

            if amount <= 0:
                continue

            # Random date within last 6 months
            days_offset = random.randint(0, 180)
            payment_date = six_months_ago + timedelta(days=days_offset)

            receipt_counter += 1
            receipt_number = f"NIT-{today.year}-{receipt_counter:05d}"

            mode = random.choice(payment_modes)

            transaction_id = None
            cheque_number = None
            if mode in (PaymentMode.upi, PaymentMode.bank_transfer, PaymentMode.card):
                transaction_id = f"TXN{random.randint(100000000, 999999999)}"
            elif mode == PaymentMode.cheque:
                cheque_number = f"CHQ{random.randint(100000, 999999)}"

            late_fine = Decimal("0.00")
            if random.random() < 0.08:
                late_fine = Decimal(str(random.choice([100, 200, 500])))

            payment = Payment(
                student_id=sf.student_id,
                student_fee_id=sf.id,
                receipt_number=receipt_number,
                amount=Decimal(str(amount)),
                payment_mode=mode,
                transaction_id=transaction_id,
                cheque_number=cheque_number,
                payment_date=payment_date,
                late_fine=late_fine,
                discount=Decimal("0.00"),
                scholarship_adjustment=Decimal("0.00"),
                remarks=random.choice([
                    None, "Semester fee payment", "Partial payment",
                    "Hostel fee", "Full fee payment", "Installment payment",
                ]),
                status=PaymentStatus.completed,
                created_by=accountant_user.id,
            )
            db.add(payment)
            payments_created.append(payment)

            # Update student fee
            sf.paid_amount = Decimal(str(float(sf.paid_amount or 0) + amount))
            new_balance = float(sf.total_amount or 0) - float(sf.paid_amount or 0) - float(sf.discount_amount or 0) - float(sf.scholarship_amount or 0)
            sf.balance = Decimal(str(max(0, new_balance)))

            if float(sf.balance) <= 0:
                sf.status = FeeStatus.paid
            elif float(sf.paid_amount) > 0:
                sf.status = FeeStatus.partial
            else:
                sf.status = FeeStatus.pending

        # Update college settings receipt counter
        college_settings.receipt_counter = receipt_counter

        db.flush()
        print(f"  Created {len(payments_created)} payments.")

        # ──────────────────────────────────────────────────────
        # 9. Create Expenses
        # ──────────────────────────────────────────────────────
        expense_categories = list(ExpenseCategory)
        vendor_names = [
            "ABC Electricals",
            "Kumar Hardware",
            "City Maintenance Services",
            "Tech Lab Supplies Pvt Ltd",
            "Delhi Office Supplies",
            "National Transport Co.",
            "Event Masters Pvt Ltd",
            "Green Clean Services",
            "Digital Solutions Inc",
            "Bangalore Power Corp",
            "Excellence Stationery",
            "SafeGuard Security",
            "Premier Catering",
            "NetConnect ISP",
            "Modern Furniture Works",
        ]

        expense_descriptions = {
            ExpenseCategory.salary: [
                "Monthly salary for teaching staff",
                "Administrative staff salary",
                "Guest lecturer honorarium",
                "Lab assistant salary",
            ],
            ExpenseCategory.electricity: [
                "Monthly electricity bill",
                "Electricity bill for hostel block",
                "Generator fuel charges",
            ],
            ExpenseCategory.maintenance: [
                "Building repair and maintenance",
                "Plumbing repair work",
                "Painting of academic block",
                "AC maintenance service",
            ],
            ExpenseCategory.events: [
                "Annual day celebrations",
                "Technical fest expenses",
                "Sports day organization",
                "Cultural event expenses",
            ],
            ExpenseCategory.lab_equipment: [
                "Computer lab equipment purchase",
                "Physics lab instruments",
                "Chemistry lab consumables",
                "Networking equipment for lab",
            ],
            ExpenseCategory.office: [
                "Office stationery purchase",
                "Printer cartridge and supplies",
                "Office furniture repair",
            ],
            ExpenseCategory.transport: [
                "College bus maintenance",
                "Fuel charges for vehicles",
                "Vehicle insurance premium",
            ],
            ExpenseCategory.miscellaneous: [
                "Newspaper and magazine subscription",
                "Miscellaneous administrative expenses",
                "Emergency repair work",
            ],
        }

        expense_modes = ["cash", "upi", "bank_transfer", "cheque", "card"]
        admin_user = users[1]  # admin

        expenses_created = []
        for i in range(30):
            cat = random.choice(expense_categories)
            desc_list = expense_descriptions.get(cat, ["General expense"])
            desc = random.choice(desc_list)
            vendor = random.choice(vendor_names)

            # Realistic amounts by category
            if cat == ExpenseCategory.salary:
                amount = random.randint(25000, 85000)
            elif cat == ExpenseCategory.electricity:
                amount = random.randint(15000, 50000)
            elif cat == ExpenseCategory.maintenance:
                amount = random.randint(5000, 40000)
            elif cat == ExpenseCategory.events:
                amount = random.randint(10000, 75000)
            elif cat == ExpenseCategory.lab_equipment:
                amount = random.randint(20000, 150000)
            elif cat == ExpenseCategory.office:
                amount = random.randint(2000, 15000)
            elif cat == ExpenseCategory.transport:
                amount = random.randint(5000, 30000)
            else:
                amount = random.randint(1000, 20000)

            days_offset = random.randint(0, 180)
            expense_date = six_months_ago + timedelta(days=days_offset)

            expense = Expense(
                category=cat,
                description=desc,
                amount=Decimal(str(amount)),
                vendor_name=vendor,
                payment_mode=random.choice(expense_modes),
                bill_number=f"BILL-{random.randint(10000, 99999)}" if random.random() > 0.2 else None,
                expense_date=expense_date,
                remarks=random.choice([None, "Regular expense", "Urgent requirement", "Approved by HOD"]),
                created_by=admin_user.id,
            )
            db.add(expense)
            expenses_created.append(expense)

        db.flush()
        print(f"  Created {len(expenses_created)} expenses.")

        # ──────────────────────────────────────────────────────
        # Commit everything
        # ──────────────────────────────────────────────────────
        db.commit()
        print("\nDatabase seeding completed successfully!")
        print(f"  Users: {len(users)}")
        print(f"  Courses: {len(courses)}")
        print(f"  Branches: {total_branches}")
        print(f"  Fee Structures: {len(fee_structures)}")
        print(f"  Students: {len(students)}")
        print(f"  Student Fees: {len(student_fees)}")
        print(f"  Payments: {len(payments_created)}")
        print(f"  Expenses: {len(expenses_created)}")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    seed_database()
