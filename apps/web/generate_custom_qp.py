from fpdf import FPDF

class QuestionPDF(FPDF):
    def header(self):
        self.set_font('helvetica', 'B', 12)
        self.set_text_color(40, 40, 40)
        self.cell(0, 10, 'BIOLOGY TERM EXAM - GREENFIELD HIGH SCHOOL', border=0, align='C', new_x="LMARGIN", new_y="NEXT")
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        self.set_font('helvetica', 'I', 8)
        self.set_text_color(150, 150, 150)
        self.cell(0, 10, f'Page {self.page_no()} of {{nb}}', border=0, align='C')

pdf = QuestionPDF()
pdf.set_auto_page_break(auto=True, margin=15)
pdf.add_page()

# Page 1 - Section A
pdf.set_font('times', 'B', 11)
pdf.cell(0, 10, "SECTION A (General Concepts)", new_x="LMARGIN", new_y="NEXT")
pdf.set_font('times', '', 10)

pdf.multi_cell(0, 8, "Q1. Define photosynthesis and list the raw materials required for this process. (5 marks)")
pdf.ln(5)

pdf.multi_cell(0, 8, "Q2. Explain the main differences between plant cells and animal cells. (10 marks)")
pdf.ln(5)

# Page 2 - Section B
pdf.add_page()
pdf.set_font('times', 'B', 11)
pdf.cell(0, 10, "SECTION B (Cellular Biology)", new_x="LMARGIN", new_y="NEXT")
pdf.set_font('times', '', 10)

pdf.multi_cell(0, 8, "Q3. Describe the structure of a cell membrane. (5 marks)")
pdf.ln(5)

pdf.multi_cell(0, 8, "Q4. Discuss cellular respiration and explain the role of ATP in details. (10 marks)")

pdf.output("custom_question_paper.pdf")
print("PDF created successfully: custom_question_paper.pdf")
