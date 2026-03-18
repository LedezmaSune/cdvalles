const fs = require('fs');
const path = require('path');

const dir = process.cwd();
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html') && f !== 'index.html' && f !== 'wacrm.html');

const headFonts = `
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <!-- Phosphor Icons -->
    <script src="https://unpkg.com/@phosphor-icons/web"></script>
    <link rel="stylesheet" href="styles.css" />
`;

const animatedBg = `
    <!-- Fondo Animado Moderno -->
    <div class="background-elements">
      <div class="blob red"></div>
      <div class="blob yellow"></div>
      <div class="blob accent"></div>
    </div>
`;

const newHeader = `
    <!-- Barra de navegación -->
    <header class="navbar">
      <div class="navbar-content">
        <i class="ph-fill ph-storefront logo-icon"></i>
        <h1>Región CD Valles</h1>
      </div>
    </header>
`;

const newFooter = `
    <!-- Pie de página -->
    <footer class="footer">
      <div class="footer-content">
        <p>Grupo Elektra &copy; <span id="year"></span> | Región CD Valles</p>
      </div>
    </footer>
`;

files.forEach(file => {
  let content = fs.readFileSync(path.join(dir, file), 'utf8');

  // 1. Update Head (fonts and icons)
  if (!content.includes('fonts.googleapis.com') && content.includes('<link rel="stylesheet" href="styles.css"')) {
    content = content.replace(
      /<link rel="stylesheet" href="styles\.css".*?>/i,
      headFonts.trim()
    );
  }

  // 2. Add Animated Background right after <body>
  if (!content.includes('background-elements') && content.includes('<body')) {
    content = content.replace(/(<body.*?>)/i, `$1\n${animatedBg}`);
  }

  // 3. Update Navbar
  if (content.match(/<(header|div) class="navbar".*?>.*?<\/(header|div)>/i)) {
    content = content.replace(/<(header|div) class="navbar".*?>.*?<\/(header|div)>/i, newHeader.trim());
  } else if (content.match(/<(header|div) class="navbar">/i)) {
    // If it's just the opening tag with no closing tag
    content = content.replace(/<(header|div) class="navbar">.*?(?=[\n\r])/i, newHeader.trim());
  }

  // 4. Update Footer
  if (content.match(/<footer class="footer".*?>[\s\S]*?<\/footer>/i)) {
    content = content.replace(/<footer class="footer".*?>[\s\S]*?<\/footer>/i, newFooter.trim());
  }

  fs.writeFileSync(path.join(dir, file), content, 'utf8');
  console.log('Updated:', file);
});
