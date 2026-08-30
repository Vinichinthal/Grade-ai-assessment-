from fpdf import FPDF

class StudentPDF(FPDF):
    def header(self):
        self.set_font('helvetica', 'B', 8)
        self.set_text_color(150, 150, 150)
        self.cell(0, 10, 'PHYSICS FINAL EXAM - STUDENT ANSWER SHEET', border=0, align='C', new_x="LMARGIN", new_y="NEXT")
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font('helvetica', 'I', 8)
        self.set_text_color(150, 150, 150)
        self.cell(0, 10, f'Page {self.page_no()} of {{nb}}', border=0, align='C')

pdf = StudentPDF()
pdf.set_auto_page_break(auto=True, margin=15)
pdf.add_page()

# Page 1
pdf.set_font('times', 'I', 12)
pdf.set_text_color(40, 50, 150)
pdf.cell(0, 10, "Q1 Answer: Newton's First Law of Motion", new_x="LMARGIN", new_y="NEXT")
pdf.multi_cell(0, 8, "Newton's first law of motion: It states that an object will remain at rest or continue to move at a constant velocity in a straight line unless it is acted on by an external net force. For example, a book resting on a table stays there unless pushed.")
pdf.ln(15)

pdf.cell(0, 10, "Q3(a) Answer: Kinetic Energy Definition", new_x="LMARGIN", new_y="NEXT")
pdf.multi_cell(0, 8, "Kinetic energy is defined as the energy possessed by an object due to its motion. Work needs to be done to accelerate it. The SI unit of kinetic energy is the Joule (J).")

# Page 2
pdf.add_page()
pdf.cell(0, 10, "Q2 Answer: Scalar vs Vector", new_x="LMARGIN", new_y="NEXT")
pdf.multi_cell(0, 8, "Speed is a scalar quantity which represents how fast an object is moving. Velocity is a vector quantity, representing rate of movement and direction. Example: Speed is 10 m/s. Velocity is 10 m/s North.")
pdf.ln(15)

pdf.cell(0, 10, "Q3(b) Answer: Kinetic Energy Calculation (Part 1)", new_x="LMARGIN", new_y="NEXT")
pdf.multi_cell(0, 8, "Given: Mass m = 2kg, Velocity v = 5m/s. Formula: KE = 1/2 * m * v^2. Calculation: KE = 0.5 * 2 * (5 * 5)...")

# Page 3
pdf.add_page()
pdf.cell(0, 10, "Q3(b) Answer: Kinetic Energy Calculation (Part 2)", new_x="LMARGIN", new_y="NEXT")
pdf.multi_cell(0, 8, "... = 1 * 25 = 25. The final kinetic energy is 25 Joules.")
pdf.ln(15)

pdf.cell(0, 10, "Q5 Answer: Pendulum Gravity Experiment", new_x="LMARGIN", new_y="NEXT")
pdf.multi_cell(0, 8, "Pendulum Experiment: Hang a mass from a string. Measure length L. Displace it slightly and time 20 oscillations. T = time / 20. Formula: T = 2pi * sqrt(L/g), so g = 4pi^2 * L / T^2. Errors: 1. Air resistance slowing the pendulum. 2. Human reaction time during stopwatch starts.")
pdf.ln(15)

pdf.cell(0, 10, "Extra scribble: Anomaly", new_x="LMARGIN", new_y="NEXT")
pdf.multi_cell(0, 8, "Einstein's theory of relativity relates energy and mass by E = mc^2. E is energy, m is mass, c is the speed of light in a vacuum (3 * 10^8 m/s). This was discovered in 1905.")

pdf.output("student_answers.pdf")
print("PDF created successfully: student_answers.pdf")
