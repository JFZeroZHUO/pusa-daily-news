print("Creating HTML...")
html = open('daily-2026-03-25.html', 'w', encoding='utf-8')
html.write(open('temp_html_content.txt').read())
html.close()
