const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');

const EPUBS_DIR = path.resolve(__dirname, '../epubs');
const EPUB_URL = 'https://www.gutenberg.org/cache/epub/2000/pg2000.epub';

function wrapHtml(title, body) {
  return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>${title}</title>
<link rel="stylesheet" type="text/css" href="pgepub.css" />
<link rel="stylesheet" type="text/css" href="0.css" />
<style>
.enrich-section { margin: 2em 0; }
.enrich-section h1 { font-size: 1.4em; margin-bottom: 0.5em; }
.enrich-section p { text-indent: 1.5em; margin: 0.5em 0; }
.enrich-section .illo { margin: 1em 0; text-align: center; }
.enrich-section .illo img { max-width: 100%; height: auto; }
.enrich-section .illo-caption { font-style: italic; font-size: 0.85em; text-align: center; margin-top: 0.3em; }
</style></head>
<body>${body}</body></html>`;
}

async function downloadDoréImages(zip) {
  const images = [
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Gustave_Dor%C3%A9_-_Miguel_de_Cervantes_-_Don_Quixote_-_Part_1_-_Chapter_1_-_Plate_1.jpg/500px-Gustave_Dor%C3%A9_-_Miguel_de_Cervantes_-_Don_Quixote_-_Part_1_-_Chapter_1_-_Plate_1.jpg',
      name: 'dore_01_quijote_lector.jpg',
      caption: 'Don Quijote leyendo libros de caballerías (Capítulo 1)'
    },
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/Gustave_Dor%C3%A9_-_Miguel_de_Cervantes_-_Don_Quixote_-_Part_1_-_Chapter_8_-_Plate_10.jpg/500px-Gustave_Dor%C3%A9_-_Miguel_de_Cervantes_-_Don_Quixote_-_Part_1_-_Chapter_8_-_Plate_10.jpg',
      name: 'dore_02_molinos.jpg',
      caption: 'La aventura de los molinos de viento (Capítulo 8)'
    },
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Gustave_Dor%C3%A9_-_Miguel_de_Cervantes_-_Don_Quixote_-_Part_1_-_Chapter_16_-_Plate_28.jpg/500px-Gustave_Dor%C3%A9_-_Miguel_de_Cervantes_-_Don_Quixote_-_Part_1_-_Chapter_16_-_Plate_28.jpg',
      name: 'dore_03_venta.jpg',
      caption: 'Don Quijote en la venta (Capítulo 16)'
    },
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Gustave_Dor%C3%A9_-_Miguel_de_Cervantes_-_Don_Quixote_-_Part_2_-_Chapter_10_-_Plate_20.jpg/500px-Gustave_Dor%C3%A9_-_Miguel_de_Cervantes_-_Don_Quixote_-_Part_2_-_Chapter_10_-_Plate_20.jpg',
      name: 'dore_04_dulcinea.jpg',
      caption: 'Don Quijote y Sancho ante Dulcinea (Parte II, Capítulo 10)'
    },
  ];
  for (const img of images) {
    try {
      const res = await fetch(img.url);
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        zip.addFile(`OEBPS/Images/${img.name}`, buf);
        console.log(`  Downloaded: ${img.name}`);
      }
    } catch (e) {
      console.warn(`  Failed to download ${img.url}: ${e.message}`);
    }
  }
}

async function main() {
  console.log('Downloading Gutenberg EPUB...');
  let sourceZip;
  try {
    const res = await fetch(EPUB_URL);
    const buf = Buffer.from(await res.arrayBuffer());
    sourceZip = new AdmZip(buf);
    console.log(`  ${buf.length} bytes downloaded`);
  } catch (e) {
    const localPath = path.join(EPUBS_DIR, 'don-quijote-de-la-mancha.epub');
    if (fs.existsSync(localPath)) {
      console.log('Using local EPUB...');
      sourceZip = new AdmZip(localPath);
    } else {
      console.error('Failed to download and no local copy found');
      process.exit(1);
    }
  }

  console.log('Creating enriched EPUB in-memory...');
  const outputZip = new AdmZip();

  // Copy all entries from source
  sourceZip.getEntries().forEach(e => {
    if (e.isDirectory) {
      outputZip.addFile(e.entryName, Buffer.alloc(0), '', 0o644);
    } else {
      outputZip.addFile(e.entryName, e.getData());
    }
  });

  // Find opf entry to determine OEBPS directory
  const opfEntry = sourceZip.getEntries().find(e => e.entryName.endsWith('content.opf'));
  if (!opfEntry) { console.error('content.opf not found'); process.exit(1); }

  // Get the OEBPS dir from the opf path (e.g., "OEBPS/content.opf" -> dirname = "OEBPS")
  const opfPathParts = opfEntry.entryName.split('/');
  const oebps = opfPathParts.slice(0, -1).join('/');

  console.log('Creating enriched content...');

  const pages = [];

  // Page: Prólogo - Análisis literario
  pages.push({
    id: 'analisis',
    title: 'Análisis literario',
    html: wrapHtml('Análisis literario', `<div class="enrich-section">
<h1>Análisis literario de Don Quijote de la Mancha</h1>
<h2>Contexto histórico</h2>
<p>Miguel de Cervantes Saavedra (1547-1616) publicó la primera parte del Quijote en 1605, obteniendo un éxito inmediato. La segunda parte apareció en 1615, un año antes de su muerte. La obra surge en el contexto del Siglo de Oro español, un período de esplendor cultural que coincidió con la decadencia política del Imperio Español bajo los Austrias.</p>
<p>España vivía una profunda crisis económica y social. La nobleza ociosa se aferraba a ideales caballerescos anacrónicos, mientras la Inquisición mantenía un férreo control ideológico. Cervantes, que había participado en la Batalla de Lepanto y sufrido cautiverio en Argel, conocía bien las contradicciones de su época.</p>

<h2>Estructura y estilo</h2>
<p>La obra se divide en dos partes. La primera (1605) consta de 52 capítulos y narra la primera salida de don Quijote, sus aventuras en solitario y luego acompañado de Sancho Panza, y su regreso a casa. La segunda (1615) tiene 74 capítulos y presenta un Quijote más consciente de su papel, enfrentando a personajes que ya lo conocen por la lectura de la primera parte.</p>
<p>El estilo cervantino se caracteriza por el perspectivismo: un mismo hecho es narrado desde múltiples puntos de vista, mostrando la relatividad de la verdad. El narrador juega con el lector, finge basarse en manuscritos árabes del historiador Cide Hamete Benengeli, y rompe constantemente la ilusión narrativa.</p>

<h2>Temas principales</h2>
<p><strong>Realidad versus ficción:</strong> El conflicto central de la obra es la imposibilidad de distinguir entre lo real y lo imaginario. Don Quijote ve gigantes donde hay molinos, ejércitos donde hay rebaños, y castillos donde hay ventas. Pero Cervantes sugiere que quizás la locura quijotesca es una forma superior de sabiduría.</p>
<p><strong>La locura y la cordura:</strong> Don Quijote enloquece por leer demasiados libros de caballerías, pero en sus momentos de lucidez demuestra una inteligencia y sabiduría notables. Sancho, inicialmente el hombre práctico y sensato, termina contagiado de la locura quijotesca. La línea entre locura y cordura se desdibuja constantemente.</p>
<p><strong>El idealismo frente al materialismo:</strong> Don Quijote representa el idealismo más puro: quiere desfacer entuertos, proteger a los débiles y restaurar la justicia en el mundo. Sancho representa el materialismo: le interesa la comida, el dinero y las promesas de una ínsula. Sin embargo, ambos personajes se necesitan y se complementan.</p>

<h2>Personajes principales</h2>
<p><strong>Don Quijote:</strong> Alonso Quijano, un hidalgo manchego que enloquece de leer libros de caballerías y decide convertirse en caballero andante. Es alto, delgado, de unos cincuenta años. Su nobleza de espíritu contrasta con su apariencia ridícula. Evoluciona a lo largo de la obra, ganando en sabiduría y perdiendo algo de su locura.</p>
<p><strong>Sancho Panza:</strong> Un labrador vecino de don Quijote, bajo y barrigudo, que lo acompaña como escudero a cambio de la promesa de una ínsula. Representa el sentido común y la sabiduría popular. Su lenguaje está lleno de refranes y dichos. A lo largo de la obra, Sancho se "quijotiza" mientras don Quijote se "sanchifica".</p>
<p><strong>Dulcinea del Toboso:</strong> El amor idealizado de don Quijote, basado en una campesina real llamada Aldonza Lorenzo. Nunca aparece realmente en la obra, pero su nombre es invocado constantemente. Representa el amor platónico y la idealización de la realidad.</p>

<h2>Importancia literaria</h2>
<p>El Quijote está considerada la primera novela moderna occidental. Cervantes innovó al crear personajes complejos que evolucionan, al usar el perspectivismo narrativo, y al incorporar el diálogo como vehículo de caracterización. La influencia de la obra en la literatura universal es incalculable: ha inspirado a escritores como Flaubert, Dostoyevski, Kafka, Borges y García Márquez.</p>
<p>La obra ha sido traducida a más de sesenta idiomas y es, después de la Biblia, el libro más traducido y estudiado del mundo. El personaje de don Quijote se ha convertido en un arquetipo universal: el idealista que lucha contra la adversidad, el soñador que se niega a aceptar una realidad mediocre.</p>
</div>`)
  });

  // Page: Comentarios por capítulos
  pages.push({
    id: 'comentarios',
    title: 'Comentarios selectos',
    html: wrapHtml('Comentarios selectos', `<div class="enrich-section">
<h1>Comentarios sobre capítulos selectos</h1>

<h2>Capítulo 1: Que trata de la condición y ejercicio del famoso hidalgo don Quijote de la Mancha</h2>
<p>El capítulo inicial nos presenta a Alonso Quijano, un hidalgo de unos cincuenta años que "se enfrascó tanto en su lectura, que se le pasaban las noches leyendo de claro en claro, y los días de turbio en turbio". Cervantes establece desde el principio la causa de la locura quijotesca: el exceso de lectura. Es notable que Cervantes, un gran lector, haga de la lectura misma el origen de la aventura.</p>
<p>La descripción de los aparejos de don Quijote —sus armas que "estaban llenas de orín y llenas de moho", su rocín flaco que él bautiza como Rocinante— es una obra maestra del humor cervantino. El contraste entre la nobleza de las intenciones de don Quijote y la pobreza de sus medios es el motor cómico de toda la obra.</p>

<h2>Capítulo 8: Del buen suceso que el valeroso don Quijote tuvo en la espantable y jamás imaginada aventura de los molinos de viento</h2>
<p>La aventura más famosa de la literatura universal. Don Quijote ve treinta o cuarenta molinos de viento y los toma por "desaforados gigantes". A pesar de las advertencias de Sancho ("Mire vuestra merced —respondió Sancho— que aquellos que allí se parecen no son gigantes, sino molinos de viento"), don Quijote arremete contra ellos y es derribado por una de las aspas.</p>
<p>Esta escena es la metáfora perfecta de la lucha del idealismo contra la realidad. Cervantes nos hace reír de la locura de don Quijote, pero también nos hace preguntarnos: ¿quién es más feliz, el que ve gigantes o el que solo ve molinos?</p>

<h2>Capítulo 22: De la libertad que dio don Quijote a muchos desdichados que mal de su grado los llevaban donde no quisieran ir</h2>
<p>Don Quijote libera a una cadena de galeotes que son conducidos a galeras. Cree que son "oprimidos de la violencia" y que es su deber como caballero andante liberarlos. Los galeotes, una vez liberados, agradecen la libertad apedreando a don Quijote y a Sancho.</p>
<p>Este episodio muestra la brecha entre las nobles intenciones de don Quijote y las consecuencias reales de sus actos. Cervantes, que conocía bien el mundo de los presos y marginados, nos ofrece una visión compleja de la justicia y la libertad.</p>

<h2>Capítulo 52: De la pendencia que don Quijote tuvo con el cabrero... (Fin de la Primera Parte)</h2>
<p>La primera parte concluye con don Quijote siendo devuelto a su aldea en una jaula, engañado por el cura y el barbero. El final es agridulce: don Quijote es derrotado, pero promete continuar sus aventuras. Cervantes deja la puerta abierta para la segunda parte.</p>
<p>Es interesante notar que Cervantes originalmente no planeaba escribir una segunda parte. Fue la aparición de un Quijote apócrifo (escrito por Avellaneda) lo que lo motivó a escribir la continuación genuina, incorporando incluso el plagio en la trama de su propia obra.</p>

<h2>Segunda Parte, Capítulo 10: Donde se cuenta la industria que Sancho tuvo para encantar a la señora Dulcinea</h2>
<p>Sancho convence a don Quijote de que tres labradoras montadas en burros son Dulcinea y sus doncellas encantadas. Don Quijote, que solo ve a tres campesinas, atribuye su fealdad al encantamiento. Es una escena brillante donde Sancho, el discípulo, ha aprendido tan bien la lección del maestro que ahora es él quien fabrica la realidad.</p>
<p>Este episodio marca un punto de inflexión: la locura ya no es exclusiva de don Quijote. Sancho ha interiorizado la lógica quijotesca y la usa para su propio beneficio.</p>
</div>`)
  });

  // Page: Ilustraciones de Doré
  pages.push({
    id: 'ilustraciones',
    title: 'Las ilustraciones de Gustave Doré',
    html: wrapHtml('Las ilustraciones de Gustave Doré', `<div class="enrich-section">
<h1>Las ilustraciones de Gustave Doré</h1>
<p>El artista francés Gustave Doré (1832-1883) realizó una de las series más famosas de ilustraciones para el Quijote, publicadas en 1863. Sus grabados, de un detalle y expresividad extraordinarios, capturan a la perfección la grandeza y la melancolía de la obra cervantina.</p>
<p>Doré trabajó con el editor Louis Hachette para crear una edición de lujo que incluía 377 ilustraciones. Su visión del Quijote ha influido profundamente en la imaginería popular de la obra —cuando imaginamos a don Quijote, a menudo lo imaginamos a través de los ojos de Doré.</p>
<p>A continuación presentamos algunas de sus ilustraciones más emblemáticas.</p>

<div class="illo"><img src="Images/dore_01_lector.jpg" alt="Don Quijote leyendo" /><p class="illo-caption">"En un lugar de la Mancha, de cuyo nombre no quiero acordarme" — Don Quijote consumido por la lectura de libros de caballerías. Doré captura la obsesión que llevará al hidalgo a la locura.</p></div>

<div class="illo"><img src="Images/dore_02_molinos.jpg" alt="Molinos de viento" /><p class="illo-caption">La aventura más famosa: don Quijote carga contra los molinos de viento. Doré representa la escena con un dramatismo que realza la épica absurda del momento.</p></div>

<div class="illo"><img src="Images/dore_03_venta.jpg" alt="La venta" /><p class="illo-caption">Don Quijote es armado caballero en una venta que él imagina como castillo. Las ilustraciones de Doré capturan la atmósfera entre lo real y lo imaginado. Esta es la ilustración 16 de Doré, correspondiente al Capítulo 3 de la Primera Parte.</p></div>

</div>`)
  });

  // Page: Contexto histórico
  pages.push({
    id: 'contexto',
    title: 'Contexto histórico',
    html: wrapHtml('Contexto histórico', `<div class="enrich-section">
<h1>Contexto histórico de la España del Quijote</h1>

<h2>La España de los Austrias (siglo XVI-XVII)</h2>
<p>Durante el reinado de Felipe II (1556-1598) y Felipe III (1598-1621), España era la potencia hegemónica de Europa, pero comenzaba a mostrar signos de decadencia. Las guerras constantes, la inflación causada por la llegada de metales preciosos de América, y la rigidez social estaban erosionando el imperio.</p>
<p>La sociedad española estaba dividida en estamentos: nobleza, clero y pueblo llano. Los hidalgos, como Alonso Quijano, pertenecían a la nobleza baja —tenían el privilegio de no pagar impuestos pero a menudo vivían en la pobreza. Esta posición social precaria es el punto de partida de la sátira cervantina.</p>

<h2>Los libros de caballerías</h2>
<p>En el siglo XVI, los libros de caballerías eran extremadamente populares en España. Obras como el Amadís de Gaula (1508) vendían miles de ejemplares y creaban un imaginario colectivo de caballeros andantes, doncellas en apuros y gigantes malvados. Cervantes, que conocía bien este género, lo parodió en el Quijote.</p>
<p>Irónicamente, el éxito del Quijote contribuyó a la decadencia del género que parodiaba. Después de Cervantes, era imposible tomarse en serio los libros de caballerías.</p>

<h2>La Inquisición y la censura</h2>
<p>El Santo Oficio de la Inquisición vigilaba la producción cultural y perseguía cualquier desviación de la ortodoxia católica. Cervantes tuvo que navegar cuidadosamente estas restricciones. Por ejemplo, la quema de libros de caballerías en el capítulo 6 de la primera parte puede leerse como una crítica velada a la censura inquisitorial.</p>

<h2>La vida de Cervantes</h2>
<p>Miguel de Cervantes nació en Alcalá de Henares en 1547. Participó en la Batalla de Lepanto (1571), donde perdió el uso de la mano izquierda. Fue capturado por piratas berberiscos en 1575 y pasó cinco años cautivo en Argel. Tras ser rescatado, trabajó como recaudador de impuestos, fue excomulgado y encarcelado por irregularidades en sus cuentas. Se dice que el Quijote comenzó a escribirlo en la cárcel.</p>
<p>La vida de Cervantes fue tan novelesca como la de su creación. Sus experiencias en Lepanto, su cautiverio en Argel, sus problemas con la justicia —todo aparece reflejado, de una forma u otra, en las páginas del Quijote.</p>
</div>`)
  });

  // Read existing content.opf
  const opfData = opfEntry.getData().toString('utf-8');

  // Add new pages to manifest (before </manifest>)
  const newManifestItems = pages.map(p =>
    `    <item id="enrich_${p.id}" href="${p.id}.xhtml" media-type="application/xhtml+xml" />`
  ).join('\n');

  let opfUpdated = opfData.replace('</manifest>', newManifestItems + '\n  </manifest>');

  // Add new pages to spine (before </spine>)
  const newSpineItems = pages.map(p =>
    `    <itemref idref="enrich_${p.id}" />`
  ).join('\n');

  opfUpdated = opfUpdated.replace('</spine>', newSpineItems + '\n  </spine>');

  // Update OPF in zip
  outputZip.addFile(opfEntry.entryName, Buffer.from(opfUpdated, 'utf-8'));

  // Add new XHTML pages to zip
  for (const page of pages) {
    outputZip.addFile(`${oebps}/${page.id}.xhtml`, Buffer.from(page.html, 'utf-8'));
    console.log(`  Added: ${oebps}/${page.id}.xhtml`);
  }

  // Download Doré images and add to ZIP
  console.log('Downloading Doré illustrations...');
  const imageUrls = [
    { url: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Don_Quixote_1.jpg', name: 'dore_01_lector.jpg' },
    { url: 'https://upload.wikimedia.org/wikipedia/commons/7/75/Don_Quixote_6.jpg', name: 'dore_02_molinos.jpg' },
    { url: 'https://upload.wikimedia.org/wikipedia/commons/1/13/Don_Quixote_16.jpg', name: 'dore_03_venta.jpg' },
  ];

  const addedImages = [];
  for (const img of imageUrls) {
    try {
      const res = await fetch(img.url);
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        outputZip.addFile(`${oebps}/Images/${img.name}`, buf);
        addedImages.push(img);
        console.log(`  Added: ${img.name} (${buf.length} bytes)`);
      } else {
        console.warn(`  Failed: ${img.name} - HTTP ${res.status}`);
      }
    } catch (e) {
      console.warn(`  Failed: ${img.name} - ${e.message}`);
    }
  }

  // Add image items to manifest
  const imgManifestItems = addedImages.map(img =>
    `    <item id="${img.name.replace('.jpg', '')}" href="Images/${img.name}" media-type="image/jpeg" />`
  ).join('\n');
  opfUpdated = outputZip.getEntry(opfEntry.entryName).getData().toString('utf-8');
  opfUpdated = opfUpdated.replace('</manifest>', imgManifestItems + '\n  </manifest>');
  outputZip.addFile(opfEntry.entryName, Buffer.from(opfUpdated, 'utf-8'));

  // Write enriched EPUB
  const outputPath = path.join(EPUBS_DIR, 'don-quijote-enriquecido.epub');
  outputZip.writeZip(outputPath);
  const stats = fs.statSync(outputPath);
  console.log(`\nDone! Created: ${outputPath} (${stats.size} bytes)`);

  // Also update the main don-quijote-de-la-mancha.epub file
  const mainPath = path.join(EPUBS_DIR, 'don-quijote-de-la-mancha.epub');
  fs.copyFileSync(outputPath, mainPath);
  console.log(`Updated: ${mainPath}`);
}

main().catch(e => { console.error(e); process.exit(1); });
