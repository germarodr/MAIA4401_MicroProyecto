"""Regenera manualUsario.html desde el Markdown. Requiere: pip install Markdown."""
from pathlib import Path
import re
import markdown

ROOT = Path(__file__).resolve().parent
source = (ROOT / "manualUsario.md").read_text(encoding="utf-8-sig")
source = re.sub(r'<link[^>]+>', '', source)
parser = markdown.Markdown(extensions=["tables", "fenced_code", "toc"], extension_configs={"toc": {"toc_depth": "2-2"}})
content = parser.convert(source)
content = content[content.index('<h2'):]
content = re.sub(r'<p><img alt="([^"]*)" src="([^"]*)"\s*/?></p>\s*<p><em>(.*?)</em></p>',
                 r'<figure><a href="\2" target="_blank" rel="noopener"><img alt="\1" src="\2" loading="eager"></a><figcaption>\3</figcaption></figure>', content, flags=re.S)
content = '<section>' + re.sub(r'(?=<h2\b)', '</section><section>', content, count=0) + '</section>'
content = content.replace('<section></section>', '', 1)
page = '''<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Manual de usuario | CiteScope</title><link rel="stylesheet" href="manualUsario.css"></head>
<body><a class="skip" href="#contenido">Saltar al contenido</a>
<header><a class="brand" href="#">CITE<span>SCOPE</span><small>Clasificación de citas científicas</small></a><span class="tag">Documentación · Entrega final</span></header>
<div class="hero"><div class="eyebrow">Guía de la aplicación</div><h1>Manual de usuario</h1>
<p class="lead">De una cita académica a una predicción interpretable. Aprenda a clasificar, consultar el historial y explorar la evaluación del modelo.</p>
<div class="hero-actions"><a class="button primary" href="#3-clasificar-una-cita">Comenzar a clasificar</a><button class="button" onclick="printManual(this)">Imprimir / Guardar PDF</button><a class="button" href="manualUsario.md">Fuente Markdown</a></div></div>
<div class="layout"><nav class="sidebar" aria-label="Contenido del manual"><strong>En esta guía</strong>TOC</nav><main id="contenido">CONTENT</main></div>
<footer><strong>CiteScope · Grupo 8</strong><br>Camilo Bejarano · German Rodriguez · Jose Arteaga · Sebastian Toro<br>Universidad de los Andes · Entrega final</footer>
<script>
async function printManual(button) {
  const label = button.textContent;
  button.disabled = true;
  button.textContent = 'Preparando imágenes…';
  try {
    await Promise.all(Array.from(document.images, image => image.decode()));
    await document.fonts.ready;
    window.print();
  } catch {
    window.alert('No se pudieron cargar todas las imágenes. Compruebe que la carpeta images acompañe al manual y vuelva a intentar.');
  } finally {
    button.disabled = false;
    button.textContent = label;
  }
}
</script></body></html>'''
page = page.replace('TOC', parser.toc).replace('CONTENT', content)
(ROOT / "manualUsario.html").write_text(page, encoding="utf-8")
print("Generado: manualUsario.html")
