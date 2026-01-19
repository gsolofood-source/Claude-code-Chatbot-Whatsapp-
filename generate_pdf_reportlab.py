#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script per generare il PDF del Business Plan
Laboratorio di Pasticceria Artigianale Inclusiva e Salutistica
Usando ReportLab
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, ListFlowable, ListItem
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY

def create_pdf():
    output_path = '/home/user/Claude-code-Chatbot-Whatsapp-/Business_Plan_Pasticceria_Inclusiva.pdf'

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )

    # Colori
    dark_blue = HexColor('#003366')
    medium_blue = HexColor('#006699')
    black = HexColor('#000000')
    gray = HexColor('#666666')

    # Stili
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'Title',
        parent=styles['Title'],
        fontSize=24,
        textColor=dark_blue,
        alignment=TA_CENTER,
        spaceAfter=20,
        fontName='Helvetica-Bold'
    )

    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontSize=14,
        textColor=medium_blue,
        alignment=TA_CENTER,
        spaceAfter=30
    )

    chapter_style = ParagraphStyle(
        'Chapter',
        parent=styles['Heading1'],
        fontSize=16,
        textColor=dark_blue,
        spaceBefore=20,
        spaceAfter=15,
        fontName='Helvetica-Bold'
    )

    section_style = ParagraphStyle(
        'Section',
        parent=styles['Heading2'],
        fontSize=12,
        textColor=medium_blue,
        spaceBefore=15,
        spaceAfter=8,
        fontName='Helvetica-Bold'
    )

    subsection_style = ParagraphStyle(
        'Subsection',
        parent=styles['Heading3'],
        fontSize=11,
        textColor=black,
        spaceBefore=10,
        spaceAfter=5,
        fontName='Helvetica-Bold'
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontSize=10,
        textColor=black,
        alignment=TA_JUSTIFY,
        spaceAfter=8,
        leading=14
    )

    quote_style = ParagraphStyle(
        'Quote',
        parent=styles['Normal'],
        fontSize=11,
        textColor=medium_blue,
        alignment=TA_CENTER,
        spaceAfter=15,
        spaceBefore=10,
        fontName='Helvetica-Oblique',
        leftIndent=30,
        rightIndent=30
    )

    bullet_style = ParagraphStyle(
        'Bullet',
        parent=styles['Normal'],
        fontSize=10,
        textColor=black,
        leftIndent=20,
        spaceAfter=5,
        bulletIndent=10
    )

    # Contenuto
    story = []

    # ============ COPERTINA ============
    story.append(Spacer(1, 6*cm))
    story.append(Paragraph('LABORATORIO DI PASTICCERIA<br/>ARTIGIANALE INCLUSIVA<br/>E SALUTISTICA', title_style))
    story.append(Spacer(1, 1*cm))
    story.append(Paragraph('Gluten Free | Lactose Free | Vegan | Basso Indice Glicemico', subtitle_style))
    story.append(Spacer(1, 3*cm))
    story.append(Paragraph('"Dolci sani, belli, buoni... PER TUTTI"', quote_style))
    story.append(Spacer(1, 4*cm))
    story.append(Paragraph('BUSINESS PLAN', ParagraphStyle('BP', parent=body_style, alignment=TA_CENTER, textColor=gray, fontSize=12)))
    story.append(PageBreak())

    # ============ INDICE ============
    story.append(Paragraph('INDICE', chapter_style))
    indice = [
        'INTRODUZIONE GENERALE',
        'CAPITOLO 1 - DESCRIZIONE DEL PROGETTO',
        'CAPITOLO 2 - ANALISI DEL CONTESTO DI MERCATO',
        'CAPITOLO 3 - DEFINIZIONE DEGLI OBIETTIVI',
        'CAPITOLO 4 - ANALISI DEL TARGET',
        'CAPITOLO 5 - BUYER PERSONAS',
        'CAPITOLO 6 - STRATEGIA COMPETITIVA',
        'CAPITOLO 7 - ANALISI DEI COMPETITOR',
        'CAPITOLO 8 - ANALISI SWOT',
        'CAPITOLO 9 - ANALISI VRIO',
        'CAPITOLO 10 - MODELLO DELLE 5 FORZE DI PORTER',
        'CAPITOLO 11 - BUSINESS MODEL CANVAS',
        'CAPITOLO 12 - STRATEGIA DI MARKETING E COMUNICAZIONE',
        'CAPITOLO 13 - ASPETTI OPERATIVI E ORGANIZZATIVI',
        'CAPITOLO 14 - PIANIFICAZIONE ECONOMICO-FINANZIARIA',
        'CAPITOLO 15 - MATRICE MoSCoW',
        'CAPITOLO 16 - ANALISI DEI RISCHI',
        'CAPITOLO 17 - SOSTENIBILITA DEL PROGETTO',
        'CAPITOLO 18 - MONITORAGGIO E VALUTAZIONE',
        'CONCLUSIONI'
    ]
    for item in indice:
        story.append(Paragraph(f'• {item}', bullet_style))
    story.append(PageBreak())

    # ============ INTRODUZIONE GENERALE ============
    story.append(Paragraph('INTRODUZIONE GENERALE', chapter_style))
    story.append(Paragraph('Premessa e Contesto del Project Work', section_style))
    story.append(Paragraph('[Sezione da completare a cura dell\'autore]', body_style))
    story.append(Paragraph('Obiettivi del Progetto e Finalita dell\'Elaborato', section_style))
    story.append(Paragraph('[Sezione da completare a cura dell\'autore]', body_style))
    story.append(Paragraph('Metodologia di Lavoro Adottata', section_style))
    story.append(Paragraph('[Sezione da completare a cura dell\'autore]', body_style))
    story.append(PageBreak())

    # ============ CAPITOLO 1 ============
    story.append(Paragraph('CAPITOLO 1 - DESCRIZIONE DEL PROGETTO', chapter_style))

    story.append(Paragraph('1.1 Descrizione dell\'Idea Imprenditoriale', section_style))
    story.append(Paragraph('<b>Nome Progetto:</b> LABORATORIO DI PASTICCERIA ARTIGIANALE INCLUSIVA E SALUTISTICA (gluten free, lactose free, vegan, a basso indice glicemico)', body_style))

    story.append(Paragraph('1.2 Inquadramento del Laboratorio di Pasticceria Inclusiva e Salutistica', section_style))
    story.append(Paragraph('Rendere la pasticceria una dolce coccola alla portata di tutti, una pasticceria inclusiva e salutistica senza compromessi sulla qualita, gusto e estetica.', body_style))
    story.append(Paragraph('L\'accento e posto su:', body_style))
    story.append(Paragraph('• L\'utilizzo di ingredienti di altissima qualita e dove possibile del territorio locale (es: bergamotto di Reggio Calabria dalle molteplici proprieta nutraceutiche)', bullet_style))
    story.append(Paragraph('• Tecniche di produzione e stoccaggio innovative al fine di preservare quanto piu possibile le proprieta nutrizionali delle materie prime e prolungare la shelf-life dei prodotti finiti', bullet_style))
    story.append(Paragraph('• Sostenibilita etica, economica e ambientale', bullet_style))

    story.append(Paragraph('1.3 Valori Fondanti del Progetto', section_style))
    story.append(Paragraph('• L\'inclusivita', bullet_style))
    story.append(Paragraph('• La qualita delle materie prime', bullet_style))
    story.append(Paragraph('• La sicurezza alimentare in tutte le fasi della filiera (dall\'arrivo delle materie prime alla vendita del prodotto finito)', bullet_style))
    story.append(Paragraph('• La sostenibilita etica, economica e ambientale', bullet_style))
    story.append(Paragraph('• L\'utilizzo di tecniche di lavorazione innovative che mirano a preservare il valore nutrizionale delle materie prime', bullet_style))

    story.append(Paragraph('1.4 Mission del Laboratorio', section_style))
    story.append(Paragraph('Creare un laboratorio di pasticceria inclusiva e salutistica specializzato nella produzione di prodotti gluten free, lactose free, vegan, a basso indice glicemico, senza rinunciare alla qualita, al gusto e all\'estetica.', body_style))
    story.append(Paragraph('"CREARE DOLCI SANI, BUONI, E BELLI PER TUTTI"', quote_style))
    story.append(Paragraph('Missione concisa, chiara, ispiratrice.', body_style))

    story.append(Paragraph('1.5 Vision di Medio-Lungo Periodo', section_style))
    story.append(Paragraph('Diventare punto di riferimento nazionale (IT) ed estero di pasticceria inclusiva e salutistica i cui caratteri distintivi sono:', body_style))
    story.append(Paragraph('• L\'inclusivita', bullet_style))
    story.append(Paragraph('• La qualita delle materie prime', bullet_style))
    story.append(Paragraph('• La sicurezza alimentare in tutte le fasi della filiera (dall\'arrivo delle materie prime alla vendita del prodotto finito)', bullet_style))
    story.append(Paragraph('• La sostenibilita etica, economica e ambientale', bullet_style))
    story.append(Paragraph('• L\'utilizzo di tecniche di lavorazione innovative che mirano a preservare il valore nutrizionale delle materie prime', bullet_style))
    story.append(PageBreak())

    # ============ CAPITOLO 2 ============
    story.append(Paragraph('CAPITOLO 2 - ANALISI DEL CONTESTO DI MERCATO', chapter_style))
    story.append(Paragraph('2.1 Evoluzione del Settore Food e Bakery Artigianale', section_style))
    story.append(Paragraph('[Sezione da completare a cura dell\'autore]', body_style))
    story.append(Paragraph('2.2 Crescita del Mercato "Free From" e Salutistico', section_style))
    story.append(Paragraph('[INSERIRE GRAFICO GOOGLE TREND IN ITALIA E NEL MONDO]', body_style))
    story.append(Paragraph('2.3 Trend di Consumo: Inclusivita, Benessere e Sostenibilita', section_style))
    story.append(Paragraph('Il mercato dei prodotti alternativi inclusivi e salutistici e in forte crescita in Italia e nel mondo.', body_style))
    story.append(Paragraph('2.4 Analisi della Domanda e dei Bisogni Emergenti', section_style))
    story.append(Paragraph('[Sezione da completare a cura dell\'autore]', body_style))
    story.append(Paragraph('2.5 Analisi Preliminare del Mercato Italiano e Internazionale', section_style))
    story.append(Paragraph('[Sezione da completare a cura dell\'autore]', body_style))
    story.append(PageBreak())

    # ============ CAPITOLO 3 ============
    story.append(Paragraph('CAPITOLO 3 - DEFINIZIONE DEGLI OBIETTIVI', chapter_style))
    story.append(Paragraph('3.1 Obiettivi Generali del Progetto', section_style))
    story.append(Paragraph('Sviluppare una linea di pasticceria inclusiva e salutistica senza compromessi sulla qualita, gusto, estetica.', body_style))

    story.append(Paragraph('3.2 Obiettivi Specifici', section_style))
    story.append(Paragraph('• Sviluppare uno shopping online prima dell\'apertura e aumentare le vendite online del 15% entro 3 mesi', bullet_style))
    story.append(Paragraph('• Ottenere un sell-out (vendite effettive al consumatore) superiori al 50% nei primi tre mesi di lancio', bullet_style))
    story.append(Paragraph('• Raggiungere un break even point (punto di pareggio) entro i 18 mesi di attivita', bullet_style))
    story.append(Paragraph('• Ottenere le certificazioni necessarie prima dell\'apertura', bullet_style))
    story.append(Paragraph('• Ottenere una lista cospicua di clienti prima dell\'apertura', bullet_style))

    story.append(Paragraph('3.3 Applicazione della Metodologia SMART', section_style))
    story.append(Paragraph('<b>SPECIFICO:</b> Sviluppare una linea di pasticceria inclusiva e salutistica senza compromessi sulla qualita, gusto, estetica', body_style))
    story.append(Paragraph('<b>TEMPORALE:</b> Ottenere le certificazioni necessarie prima dell\'apertura; ottenere una lista cospicua di clienti prima dell\'apertura', body_style))
    story.append(Paragraph('<b>MISURABILE:</b>', body_style))
    story.append(Paragraph('• Sviluppare uno shopping online prima dell\'apertura e aumentare le vendite online del 15% entro 3 mesi', bullet_style))
    story.append(Paragraph('• Ottenere un sell-out (vendite effettive al consumatore) superiori al 50% nei primi tre mesi di lancio', bullet_style))
    story.append(Paragraph('• Raggiungere un break even point (punto di pareggio) entro i 18 mesi di attivita', bullet_style))
    story.append(Paragraph('<b>RAGGIUNGIBILE:</b> Il budget stanziato e sufficiente per la realizzazione del laboratorio, e del sito di acquisti online', body_style))
    story.append(Paragraph('<b>RILEVANTE:</b> Il mercato dei prodotti alternativi inclusivi e salutistici e in forte crescita in Italia e nel mondo', body_style))

    story.append(Paragraph('3.4 Indicatori di Performance (KPI)', section_style))
    story.append(Paragraph('• Tasso di riacquisto clienti', bullet_style))
    story.append(Paragraph('• Recensioni e passaparola', bullet_style))
    story.append(Paragraph('• Margine per linea di prodotto', bullet_style))
    story.append(Paragraph('• Crescita B2B', bullet_style))
    story.append(Paragraph('• Coinvolgimento community', bullet_style))
    story.append(PageBreak())

    # ============ CAPITOLO 4 ============
    story.append(Paragraph('CAPITOLO 4 - ANALISI DEL TARGET', chapter_style))
    story.append(Paragraph('4.1 Segmentazione del Mercato', section_style))
    story.append(Paragraph('Il mercato viene segmentato in base a esigenze alimentari specifiche, scelte etiche, stili di vita orientati al benessere e canali B2B.', body_style))

    story.append(Paragraph('4.2 Target Primario B2C', section_style))
    story.append(Paragraph('• Celiaci', bullet_style))
    story.append(Paragraph('• Intolleranti al glutine e al lattosio', bullet_style))
    story.append(Paragraph('• Allergici alle proteine del latte', bullet_style))
    story.append(Paragraph('• Vegani', bullet_style))
    story.append(Paragraph('• Diabetici e soggetti che per svariate patologie (es: donne con PCOS) devono mantenere bassi i livelli di glucosio nel sangue', bullet_style))

    story.append(Paragraph('4.3 Target Secondario B2C', section_style))
    story.append(Paragraph('• Sportivi', bullet_style))
    story.append(Paragraph('• Salutisti', bullet_style))

    story.append(Paragraph('4.4 Target B2B', section_style))
    story.append(Paragraph('• B&B locali', bullet_style))
    story.append(Paragraph('• Hotel boutique locali', bullet_style))
    story.append(Paragraph('• Farmacie nazionali e estere', bullet_style))
    story.append(Paragraph('• Palestre premium nazionali', bullet_style))

    story.append(Paragraph('4.5 Analisi dei Bisogni e delle Aspettative dei Clienti', section_style))
    story.append(Paragraph('<b>Core Target:</b>', subsection_style))
    story.append(Paragraph('• Persone con intolleranze (celiachia, intolleranza al lattosio)', bullet_style))
    story.append(Paragraph('• Clienti vegan o plant-based', bullet_style))
    story.append(Paragraph('• Persone attente alla salute e alla prevenzione metabolica', bullet_style))
    story.append(Paragraph('<b>Target Estesi:</b>', subsection_style))
    story.append(Paragraph('• Famiglie inclusive (un dolce per tutti)', bullet_style))
    story.append(Paragraph('• Sportivi e professionisti attenti all\'energia e alla digeribilita', bullet_style))
    story.append(Paragraph('• Clienti curiosi e innovatori del gusto', bullet_style))
    story.append(Paragraph('<b>B2B:</b>', subsection_style))
    story.append(Paragraph('• Bar e locali che vogliono ampliare l\'offerta inclusiva', bullet_style))
    story.append(Paragraph('• Studi professionali (nutrizionisti, palestre, centri benessere)', bullet_style))
    story.append(Paragraph('• Eventi aziendali e catering consapevoli', bullet_style))
    story.append(PageBreak())

    # ============ CAPITOLO 5 ============
    story.append(Paragraph('CAPITOLO 5 - BUYER PERSONAS', chapter_style))
    story.append(Paragraph('5.1 Definizione delle Buyer Personas', section_style))
    story.append(Paragraph('Le Buyer Personas rappresentano archetipi dei clienti ideali, costruiti sulla base di caratteristiche demografiche, comportamentali e psicografiche.', body_style))

    story.append(Paragraph('5.2 Buyer Persona "Marta"', section_style))
    story.append(Paragraph('• <b>Eta:</b> 35 anni', bullet_style))
    story.append(Paragraph('• <b>Professione:</b> Insegnante di scuola primaria', bullet_style))
    story.append(Paragraph('• <b>Reddito:</b> Medio-alto', bullet_style))
    story.append(Paragraph('• <b>Interessi:</b> Alimentazione sana, benessere della famiglia, ricette senza glutine', bullet_style))
    story.append(Paragraph('• <b>Comportamento d\'acquisto:</b> Preferisce prodotti certificati, fa acquisti sia online che in negozio, da valore alle recensioni', bullet_style))
    story.append(Paragraph('• <b>Canali preferiti:</b> Social media come Instagram e Facebook, blog di cucina, newsletter', bullet_style))
    story.append(Paragraph('[INSERIRE AVATAR DELLA BUYER PERSONA MARTA CREATO TRAMITE HUBSPOT]', body_style))
    story.append(Paragraph('<b>Cosa del VRIO la convince di piu:</b>', subsection_style))
    story.append(Paragraph('• Reputazione di laboratorio sicuro (contaminazioni controllate)', bullet_style))
    story.append(Paragraph('• Know-how specializzato "free from"', bullet_style))
    story.append(Paragraph('<b>Come usarlo:</b>', subsection_style))
    story.append(Paragraph('• <b>Messaggi chiave:</b> "Sicuro per tutta la famiglia", "certificato", "ingredienti trasparenti"', bullet_style))
    story.append(Paragraph('• <b>Canali:</b> Instagram, Facebook, passaparola, sito con FAQ chiare', bullet_style))
    story.append(Paragraph('• <b>Prodotti ideali:</b> torte da colazione, biscotti per bambini, dolci per feste', bullet_style))
    story.append(Paragraph('Qui il VRIO diventa FIDUCIA', quote_style))

    story.append(Paragraph('5.3 Buyer Persona "Luca"', section_style))
    story.append(Paragraph('• <b>Eta:</b> 28 anni', bullet_style))
    story.append(Paragraph('• <b>Professione:</b> Designer grafico', bullet_style))
    story.append(Paragraph('• <b>Reddito:</b> Medio', bullet_style))
    story.append(Paragraph('• <b>Interessi:</b> Cucina vegana, sostenibilita, tendenze alimentari etiche', bullet_style))
    story.append(Paragraph('• <b>Comportamento d\'acquisto:</b> Acquista online, cerca prodotti innovativi, segue le tendenze', bullet_style))
    story.append(Paragraph('• <b>Canali preferiti:</b> Instagram, YouTube, piattaforme di ricette vegane, community online', bullet_style))
    story.append(Paragraph('<b>Cosa del VRIO lo attrae:</b>', subsection_style))
    story.append(Paragraph('• Proposta di valore unica (vegano + salute)', bullet_style))
    story.append(Paragraph('• Brand etico e inclusivo', bullet_style))
    story.append(Paragraph('<b>Come usarlo:</b>', subsection_style))
    story.append(Paragraph('• <b>Messaggi chiave:</b> "Vegano, etico, buono davvero", "senza compromessi"', bullet_style))
    story.append(Paragraph('• <b>Canali:</b> Instagram, YouTube, storytelling, collaborazioni', bullet_style))
    story.append(Paragraph('• <b>Prodotti ideali:</b> monoporzioni moderne, dessert innovativi, limited edition', bullet_style))
    story.append(Paragraph('Qui il VRIO diventa IDENTITA', quote_style))
    story.append(PageBreak())

    story.append(Paragraph('5.4 Buyer Persona "Giulia"', section_style))
    story.append(Paragraph('• <b>Eta:</b> 40 anni', bullet_style))
    story.append(Paragraph('• <b>Professione:</b> Consulente finanziario', bullet_style))
    story.append(Paragraph('• <b>Reddito:</b> Alto', bullet_style))
    story.append(Paragraph('• <b>Interessi:</b> Benessere, alimentazione equilibrata, salute a lungo termine', bullet_style))
    story.append(Paragraph('• <b>Comportamento d\'acquisto:</b> Predilige prodotti premium, presta attenzione agli ingredienti, acquista spesso in negozi specializzati', bullet_style))
    story.append(Paragraph('• <b>Canali preferiti:</b> Blog di salute, newsletter, gruppi Facebook dedicati al benessere', bullet_style))
    story.append(Paragraph('<b>Cosa del VRIO la convince:</b>', subsection_style))
    story.append(Paragraph('• Know-how sul basso indice glicemico', bullet_style))
    story.append(Paragraph('• Qualita premium e ricette studiate', bullet_style))
    story.append(Paragraph('<b>Come usarlo:</b>', subsection_style))
    story.append(Paragraph('• <b>Messaggi chiave:</b> "Dolci che rispettano il tuo equilibrio"', bullet_style))
    story.append(Paragraph('• <b>Canali:</b> newsletter, blog, consulenze, eventi', bullet_style))
    story.append(Paragraph('• <b>Prodotti ideali:</b> dolci funzionali, dessert per colazione/merenda controllata', bullet_style))
    story.append(Paragraph('Qui il VRIO diventa COMPETENZA', quote_style))

    story.append(Paragraph('5.5 Ruolo delle Buyer Personas nella Strategia di Marketing', section_style))
    story.append(Paragraph('Il tuo laboratorio non vende solo dolci, ma:', body_style))
    story.append(Paragraph('• <b>Sicurezza</b> (Marta)', bullet_style))
    story.append(Paragraph('• <b>Valori</b> (Luca)', bullet_style))
    story.append(Paragraph('• <b>Benessere consapevole</b> (Giulia)', bullet_style))
    story.append(Paragraph('Questa e la base di un brand forte e difendibile.', quote_style))
    story.append(PageBreak())

    # ============ CAPITOLO 6 ============
    story.append(Paragraph('CAPITOLO 6 - STRATEGIA COMPETITIVA', chapter_style))
    story.append(Paragraph('6.1 Posizionamento Strategico del Laboratorio', section_style))
    story.append(Paragraph('"Un laboratorio di pasticceria che crea dolci inclusivi, buoni e intelligenti, pensati per il benessere di chi li mangia."', quote_style))

    story.append(Paragraph('6.2 Strategia di Differenziazione Focalizzata', section_style))
    story.append(Paragraph('Il laboratorio opera in:', body_style))
    story.append(Paragraph('• Un mercato di nicchia', bullet_style))
    story.append(Paragraph('• Con buone difese competitive', bullet_style))
    story.append(Paragraph('• E forte potenziale di differenziazione', bullet_style))
    story.append(Paragraph('Strategia consigliata: differenziazione focalizzata (Porter).', quote_style))

    story.append(Paragraph('6.3 Elementi Distintivi Rispetto ai Competitor', section_style))
    story.append(Paragraph('Differenziarsi attraverso l\'ideazione e produzione di prodotti di pasticceria inclusivi e salutistici (dalla colazione alla coccola di fine pasto), mediante l\'utilizzo di materie prime alternative e di qualita:', body_style))
    story.append(Paragraph('<b>Farine alternative:</b> farine di riso, mais, avena, teff, grano saraceno, quinoa etc.', body_style))
    story.append(Paragraph('<b>Grassi alternativi:</b> margarina senza grassi idrogenati, olio evo e olio di semi vari, grasso di cocco etc.', body_style))
    story.append(Paragraph('<b>Zuccheri alternativi:</b> eritritolo, maltitolo, inulina, zucchero d\'agave, fruttosio', body_style))
    story.append(Paragraph('<b>Proteine vegetali innovative</b>', body_style))

    story.append(Paragraph('6.4 Coerenza tra Strategia e Valori del Progetto', section_style))
    story.append(Paragraph('Creare una brand identity forte e trasparente.', body_style))
    story.append(PageBreak())

    # ============ CAPITOLO 7 ============
    story.append(Paragraph('CAPITOLO 7 - ANALISI DEI COMPETITOR', chapter_style))
    story.append(Paragraph('7.1 Analisi dei Competitor Nazionali', section_style))

    story.append(Paragraph('<b>1. Pansy (Milano)</b>', subsection_style))
    story.append(Paragraph('Laboratorio/pasticceria che produce dolci e salati 100% gluten-free e lactose-free, con molte opzioni vegan. Focus su qualita artigianale, gusto gourmet e accoglienza inclusiva per intolleranze e scelte etiche.', body_style))

    story.append(Paragraph('<b>2. Reti di laboratori gluten-free (Free Eat e analoghi)</b>', subsection_style))
    story.append(Paragraph('Diverse realta italiane che operano come laboratori gluten free, spesso con prodotti 100% senza glutine e varianti senza lattosio e vegane. Esempi: Delishia, The Gluten Free Lab, Zero Farina, We Eat Gluten Free ecc.', body_style))

    story.append(Paragraph('<b>3. LuigiAnna</b>', subsection_style))
    story.append(Paragraph('Pasticceria artigianale che produce dolci e panetteria senza glutine e senza lattosio, con gamma di prodotti per privati e rivenditori. Si colloca piu sul gusto tradizionale rivisitato in chiave free-from.', body_style))

    story.append(Paragraph('<b>4. Sweet and Fit Healthy Bakery (Napoli)</b>', subsection_style))
    story.append(Paragraph('Concept di bakery con dolci gluten-free, vegan, proteici, e attenzione a ingredienti funzionali per esigenze alimentari.', body_style))

    story.append(Paragraph('7.2 Analisi dei Competitor Internazionali', section_style))

    story.append(Paragraph('<b>5. French Meadow Bakery (USA)</b>', subsection_style))
    story.append(Paragraph('Uno dei marchi storici di panetteria correlata alla salute negli USA: prodotti gluten-free, vegan, senza lievito, spesso certificati biologici e a basso indice glicemico.', body_style))

    story.append(Paragraph('<b>6. Cinnaholic (USA/Canada)</b>', subsection_style))
    story.append(Paragraph('Catena di bakery specializzata in dolci 100% vegan, lactose-free, egg-free con uso di ingredienti plant-based. Non e specificamente gluten-free, ma e un grande esempio globale di pasticceria inclusiva.', body_style))

    story.append(Paragraph('<b>7. Askatu Bakery (USA)</b>', subsection_style))
    story.append(Paragraph('Piccola bakery allergen-free a Seattle con prodotti gluten-free e vegan e riduzione delle principali allergie in menu.', body_style))

    story.append(Paragraph('<b>8. GluteNull Bakery (Canada)</b>', subsection_style))
    story.append(Paragraph('Produzione e vendita di prodotti gluten-free e vegan (panetteria, barrette, biscotti ecc.), con attenzione a ingredienti naturali e non-OGM.', body_style))

    story.append(Paragraph('<b>9. Incredible Bakery Company (UK)</b>', subsection_style))
    story.append(Paragraph('Bakery online e produttore di prodotti gluten-free, vegan e free-from per marketplace e B2B.', body_style))

    story.append(Paragraph('<b>10. Fit Cake (Polonia & franchising)</b>', subsection_style))
    story.append(Paragraph('Catena di pasticcerie senza zucchero, gluten-free, lactose-free e con molte opzioni vegan. E un modello di franchising presente in varie citta.', body_style))

    story.append(Paragraph('7.3 Confronto tra Modelli di Business', section_style))
    story.append(Paragraph('[INSERIRE GRAFICO]', body_style))
    story.append(Paragraph('Approcci e posizionamenti (per capire le differenze)', body_style))

    story.append(Paragraph('7.4 Posizionamento Competitivo del Laboratorio', section_style))
    story.append(Paragraph('Il posizionamento e di nicchia ma forte. Molti competitor sono:', body_style))
    story.append(Paragraph('• Solo gluten free', bullet_style))
    story.append(Paragraph('• Solo vegani', bullet_style))
    story.append(Paragraph('• Non low GI', bullet_style))
    story.append(Paragraph('Il laboratorio si distingue per l\'offerta completa: gluten-free + lactose-free + vegan + low GI.', body_style))
    story.append(PageBreak())

    # ============ CAPITOLO 8 ============
    story.append(Paragraph('CAPITOLO 8 - ANALISI SWOT', chapter_style))
    story.append(Paragraph('8.1 Metodologia SWOT', section_style))
    story.append(Paragraph('L\'analisi SWOT permette di valutare i fattori interni (punti di forza e debolezza) e i fattori esterni (opportunita e minacce) che influenzano il progetto.', body_style))

    story.append(Paragraph('8.2 Punti di Forza (Strengths)', section_style))
    story.append(Paragraph('Pochi competitor sul mercato italiano e estero. Sono ancora pochi i professionisti esperti nella produzione di prodotti inclusivi e salutistici.', body_style))

    story.append(Paragraph('8.3 Punti di Debolezza (Weaknesses)', section_style))
    story.append(Paragraph('Ancora molto scetticismo sulla bonta dei prodotti alternativi. ASSOCIAZIONE PRODOTTI ALTERNATIVI COME PRODOTTI PER MALATI.', body_style))

    story.append(Paragraph('8.4 Opportunita (Opportunities)', section_style))
    story.append(Paragraph('Pochi competitor sul mercato italiano e estero e quindi ottime possibilita di emergere in breve tempo.', body_style))

    story.append(Paragraph('8.5 Minacce (Threats)', section_style))
    story.append(Paragraph('Costo elevato delle materie prime alternative e difficolta nella loro reperibilita - individuazione di piu fornitori per l\'acquisto di una stessa materia prima; difficolta nel reperire personale di laboratorio specializzato nella produzione di prodotti alternativi inclusivi e salutistici.', body_style))

    story.append(Paragraph('8.6 Sintesi Strategica della SWOT', section_style))
    story.append(Paragraph('<b>FATTORI INTERNI:</b>', body_style))
    story.append(Paragraph('• PUNTI DI FORZA: Pochi competitor sul mercato italiano e estero. Sono ancora pochi i professionisti esperti nella produzione di prodotti inclusivi e salutistici.', bullet_style))
    story.append(Paragraph('• PUNTI DI DEBOLEZZA: Ancora molto scetticismo sulla bonta dei prodotti alternativi. ASSOCIAZIONE PRODOTTI ALTERNATIVI COME PRODOTTI PER MALATI.', bullet_style))
    story.append(Paragraph('<b>FATTORI ESTERNI:</b>', body_style))
    story.append(Paragraph('• OPPORTUNITA: Pochi competitor sul mercato italiano e estero e quindi ottime possibilita di emergere in breve tempo.', bullet_style))
    story.append(Paragraph('• MINACCE: Costo elevato delle materie prime alternative e difficolta nella loro reperibilita.', bullet_style))
    story.append(PageBreak())

    # ============ CAPITOLO 9 ============
    story.append(Paragraph('CAPITOLO 9 - ANALISI VRIO', chapter_style))
    story.append(Paragraph('9.1 Introduzione al Modello VRIO', section_style))
    story.append(Paragraph('Il modello VRIO valuta le risorse aziendali secondo quattro criteri: Valore, Rarita, Imitabilita e Organizzazione.', body_style))

    story.append(Paragraph('9.2 Analisi delle Risorse Chiave', section_style))

    story.append(Paragraph('<b>1. Know-how Specializzato in Pasticceria "Free From" e Low GI</b>', subsection_style))
    story.append(Paragraph('• Valore (V): Si - Risponde a bisogni reali (celiachia, intolleranze, veganismo, controllo glicemico)', bullet_style))
    story.append(Paragraph('• Rarita (R): Si - Pochi laboratori uniscono tutte queste caratteristiche insieme', bullet_style))
    story.append(Paragraph('• Imitabilita (I): Medio-bassa - Richiede studio, sperimentazione, errori, competenze tecniche elevate', bullet_style))
    story.append(Paragraph('• Organizzazione (O): Si (se strutturi ricette, processi e formazione)', bullet_style))
    story.append(Paragraph('Vantaggio competitivo potenzialmente sostenibile', quote_style))

    story.append(Paragraph('<b>2. Proposta di Valore Unica (Senza Glutine + Senza Lattosio + Vegano + Low GI)</b>', subsection_style))
    story.append(Paragraph('• Valore: Si - E una proposta chiara, distintiva e orientata al benessere', bullet_style))
    story.append(Paragraph('• Rarita: Alta - Molti fanno "senza glutine" o "vegano", pochissimi tutto insieme', bullet_style))
    story.append(Paragraph('• Imitabilita: Media - Copiabile nel tempo, ma non facilmente se manca la competenza', bullet_style))
    story.append(Paragraph('• Organizzazione: Si - Deve essere comunicata bene (branding, storytelling, certificazioni)', bullet_style))
    story.append(Paragraph('Vantaggio competitivo temporaneo - sostenibile se rafforzato dal brand', quote_style))

    story.append(Paragraph('<b>3. Reputazione di Laboratorio Sicuro e Affidabile</b>', subsection_style))
    story.append(Paragraph('(certificazioni, attenzione alle contaminazioni, trasparenza)', body_style))
    story.append(Paragraph('• Valore: Molto alto - Fondamentale per celiaci, diabetici e famiglie', bullet_style))
    story.append(Paragraph('• Rarita: Media - Non tutti investono davvero nella sicurezza', bullet_style))
    story.append(Paragraph('• Imitabilita: Difficile - La fiducia si costruisce nel tempo', bullet_style))
    story.append(Paragraph('• Organizzazione: Si - Procedure, controlli, formazione', bullet_style))
    story.append(Paragraph('Vantaggio competitivo sostenibile', quote_style))

    story.append(Paragraph('<b>4. Ricette Proprietarie e Gusto Elevato</b>', subsection_style))
    story.append(Paragraph('• Valore: Si - Il gusto e decisivo, soprattutto nel "free from"', bullet_style))
    story.append(Paragraph('• Rarita: Media - Dipende dalla tua creativita', bullet_style))
    story.append(Paragraph('• Imitabilita: Media - Le ricette si possono copiare, l\'esperienza no', bullet_style))
    story.append(Paragraph('• Organizzazione: Si - Se documenti e proteggi il tuo metodo', bullet_style))
    story.append(Paragraph('Parita competitiva - diventa vantaggio se unita al brand', quote_style))

    story.append(Paragraph('<b>5. Brand Posizionato su Salute, Inclusivita ed Etica</b>', subsection_style))
    story.append(Paragraph('• Valore: Si - Attira clienti consapevoli e fidelizzati', bullet_style))
    story.append(Paragraph('• Rarita: Media - Sempre piu brand parlano di salute, pochi lo fanno in modo coerente', bullet_style))
    story.append(Paragraph('• Imitabilita: Difficile - I valori autentici non si copiano', bullet_style))
    story.append(Paragraph('• Organizzazione: Si - Comunicazione coerente online e offline', bullet_style))
    story.append(Paragraph('Vantaggio competitivo sostenibile', quote_style))

    story.append(Paragraph('9.3 Valutazione del Vantaggio Competitivo', section_style))
    story.append(Paragraph('Il tuo laboratorio ha un forte potenziale di vantaggio competitivo sostenibile, soprattutto se punti su:', body_style))
    story.append(Paragraph('• Competenze tecniche elevate', bullet_style))
    story.append(Paragraph('• Sicurezza e fiducia', bullet_style))
    story.append(Paragraph('• Proposta di valore chiara', bullet_style))
    story.append(Paragraph('• Branding coerente', bullet_style))

    story.append(Paragraph('9.4 Implicazioni Strategiche del Modello VRIO', section_style))
    story.append(Paragraph('Il modello VRIO dimostra che il laboratorio possiede risorse in grado di generare vantaggi competitivi sostenibili, in particolare attraverso il know-how specializzato, la reputazione di sicurezza e il brand posizionato su valori autentici.', body_style))
    story.append(PageBreak())

    # ============ CAPITOLO 10 ============
    story.append(Paragraph('CAPITOLO 10 - MODELLO DELLE 5 FORZE DI PORTER', chapter_style))
    story.append(Paragraph('10.1 Descrizione del Modello', section_style))
    story.append(Paragraph('Il modello delle 5 Forze di Porter analizza l\'intensita competitiva e l\'attrattivita di un settore industriale.', body_style))

    story.append(Paragraph('10.2 Minaccia di Nuovi Entranti', section_style))
    story.append(Paragraph('<b>Intensita: MEDIA</b>', body_style))
    story.append(Paragraph('Perche: Il settore food e accessibile, ma il tuo posizionamento richiede:', body_style))
    story.append(Paragraph('• Competenze tecniche elevate', bullet_style))
    story.append(Paragraph('• Investimenti in formazione', bullet_style))
    story.append(Paragraph('• Attenzione alle contaminazioni', bullet_style))
    story.append(Paragraph('• Reputazione e fiducia', bullet_style))
    story.append(Paragraph('<b>Barriere all\'ingresso:</b>', body_style))
    story.append(Paragraph('• Know-how "free from" + low GI', bullet_style))
    story.append(Paragraph('• Certificazioni', bullet_style))
    story.append(Paragraph('• Brand e fiducia costruita nel tempo', bullet_style))
    story.append(Paragraph('Conclusione: Non e facile replicarti velocemente.', quote_style))

    story.append(Paragraph('10.3 Potere Contrattuale dei Fornitori', section_style))
    story.append(Paragraph('<b>Intensita: MEDIO-ALTA</b>', body_style))
    story.append(Paragraph('Perche:', body_style))
    story.append(Paragraph('• Materie prime specifiche (farine GF, dolcificanti low GI, ingredienti vegani)', bullet_style))
    story.append(Paragraph('• Pochi fornitori altamente specializzati', bullet_style))
    story.append(Paragraph('• Prezzi piu alti rispetto agli ingredienti tradizionali', bullet_style))
    story.append(Paragraph('<b>Strategia di difesa:</b>', body_style))
    story.append(Paragraph('• Diversificare i fornitori', bullet_style))
    story.append(Paragraph('• Creare partnership stabili', bullet_style))
    story.append(Paragraph('• Acquistare in volumi programmati', bullet_style))

    story.append(Paragraph('10.4 Potere Contrattuale dei Clienti', section_style))
    story.append(Paragraph('<b>Intensita: MEDIA</b>', body_style))
    story.append(Paragraph('Perche:', body_style))
    story.append(Paragraph('• Clienti informati e attenti', bullet_style))
    story.append(Paragraph('• Sensibilita al prezzo, ma', bullet_style))
    story.append(Paragraph('• Alta disponibilita a pagare per sicurezza e qualita', bullet_style))
    story.append(Paragraph('Punto chiave: Se costruisci fiducia, il prezzo diventa secondario.', quote_style))

    story.append(Paragraph('10.5 Minaccia di Prodotti Sostitutivi', section_style))
    story.append(Paragraph('<b>Intensita: MEDIA</b>', body_style))
    story.append(Paragraph('<b>Sostituti possibili:</b>', body_style))
    story.append(Paragraph('• Dolci industriali "free from"', bullet_style))
    story.append(Paragraph('• Autoproduzione casalinga', bullet_style))
    story.append(Paragraph('• Prodotti salutistici non artigianali', bullet_style))
    story.append(Paragraph('<b>Tuo vantaggio:</b>', body_style))
    story.append(Paragraph('• Artigianalita', bullet_style))
    story.append(Paragraph('• Freschezza', bullet_style))
    story.append(Paragraph('• Sicurezza', bullet_style))
    story.append(Paragraph('• Esperienza emotiva', bullet_style))

    story.append(Paragraph('10.6 Intensita della Concorrenza', section_style))
    story.append(Paragraph('<b>Intensita: MEDIO-BASSA (localmente)</b>', body_style))
    story.append(Paragraph('Perche:', body_style))
    story.append(Paragraph('• Pochi laboratori cosi specializzati', bullet_style))
    story.append(Paragraph('• Molti competitor sono: Solo gluten free, Solo vegani, Non low GI', bullet_style))
    story.append(Paragraph('Il tuo posizionamento e di nicchia ma forte.', quote_style))

    story.append(Paragraph('10.7 Sintesi dell\'Analisi Competitiva', section_style))
    story.append(Paragraph('<b>Riepilogo delle 5 Forze:</b>', body_style))
    story.append(Paragraph('• Minaccia nuovi entranti: Media', bullet_style))
    story.append(Paragraph('• Potere fornitori: Medio-Alta', bullet_style))
    story.append(Paragraph('• Potere clienti: Media', bullet_style))
    story.append(Paragraph('• Prodotti sostitutivi: Media', bullet_style))
    story.append(Paragraph('• Concorrenza: Medio-Bassa', bullet_style))
    story.append(Paragraph('<b>Conclusione Chiave:</b> Il tuo laboratorio opera in un mercato di nicchia, con buone difese competitive e forte potenziale di differenziazione.', body_style))
    story.append(Paragraph('Strategia consigliata: differenziazione focalizzata (Porter).', quote_style))
    story.append(PageBreak())

    # ============ CAPITOLO 11 ============
    story.append(Paragraph('CAPITOLO 11 - BUSINESS MODEL CANVAS', chapter_style))
    story.append(Paragraph('11.1 Introduzione al Business Model Canvas', section_style))
    story.append(Paragraph('Il Business Model Canvas e uno strumento strategico che permette di descrivere, visualizzare e progettare modelli di business attraverso nove blocchi fondamentali.', body_style))
    story.append(Paragraph('Ho creato il Business Model Canvas completo del tuo laboratorio nel canvas qui accanto.', body_style))

    story.append(Paragraph('11.2 Proposta di Valore', section_style))
    story.append(Paragraph('• Dolci artigianali inclusivi, pensati per persone con intolleranze, scelte etiche o esigenze metaboliche', bullet_style))
    story.append(Paragraph('• Pasticceria salutistica ma golosa, senza senso di rinuncia', bullet_style))
    story.append(Paragraph('• Ricette a basso indice glicemico per benessere quotidiano e stabilita energetica', bullet_style))
    story.append(Paragraph('• Trasparenza totale su ingredienti, processi e benefici', bullet_style))
    story.append(Paragraph('• Design, gusto ed esperienza al pari dell\'alta pasticceria tradizionale', bullet_style))

    story.append(Paragraph('11.3 Segmenti di Clientela', section_style))
    story.append(Paragraph('<b>Core Target:</b>', body_style))
    story.append(Paragraph('• Persone con intolleranze (celiachia, intolleranza al lattosio)', bullet_style))
    story.append(Paragraph('• Clienti vegan o plant-based', bullet_style))
    story.append(Paragraph('• Persone attente alla salute e alla prevenzione metabolica', bullet_style))
    story.append(Paragraph('<b>Target Estesi:</b>', body_style))
    story.append(Paragraph('• Famiglie inclusive (un dolce per tutti)', bullet_style))
    story.append(Paragraph('• Sportivi e professionisti attenti all\'energia e alla digeribilita', bullet_style))
    story.append(Paragraph('• Clienti curiosi e innovatori del gusto', bullet_style))
    story.append(Paragraph('<b>B2B:</b>', body_style))
    story.append(Paragraph('• Bar e locali che vogliono ampliare l\'offerta inclusiva', bullet_style))
    story.append(Paragraph('• Studi professionali (nutrizionisti, palestre, centri benessere)', bullet_style))
    story.append(Paragraph('• Eventi aziendali e catering consapevoli', bullet_style))

    story.append(Paragraph('11.4 Canali', section_style))
    story.append(Paragraph('• Vendita diretta in laboratorio', bullet_style))
    story.append(Paragraph('• Prenotazioni e ordini su richiesta', bullet_style))
    story.append(Paragraph('• Social media (Instagram, storytelling visivo)', bullet_style))
    story.append(Paragraph('• Google Maps e recensioni locali', bullet_style))
    story.append(Paragraph('• Eventi, mercati, collaborazioni territoriali', bullet_style))
    story.append(Paragraph('• B2B: contatto diretto e partnership', bullet_style))

    story.append(Paragraph('11.5 Relazioni con i Clienti', section_style))
    story.append(Paragraph('• Relazione umana e fiduciaria', bullet_style))
    story.append(Paragraph('• Educazione gentile al benessere (non medicalizzata)', bullet_style))
    story.append(Paragraph('• Personalizzazione su esigenze specifiche', bullet_style))
    story.append(Paragraph('• Community locale (eventi, degustazioni)', bullet_style))
    story.append(Paragraph('• Ascolto attivo e feedback continuo', bullet_style))

    story.append(Paragraph('11.6 Flussi di Ricavo', section_style))
    story.append(Paragraph('• Vendita dolci monoporzione e torte', bullet_style))
    story.append(Paragraph('• Ordini personalizzati (eventi, compleanni, ricorrenze)', bullet_style))
    story.append(Paragraph('• Forniture B2B', bullet_style))
    story.append(Paragraph('• Box degustazione tematiche', bullet_style))
    story.append(Paragraph('• Workshop e laboratori (educativi / esperienziali)', bullet_style))

    story.append(Paragraph('11.7 Risorse Chiave', section_style))
    story.append(Paragraph('• Know-how in pasticceria inclusiva e salutistica', bullet_style))
    story.append(Paragraph('• Ricette proprietarie a basso IG', bullet_style))
    story.append(Paragraph('• Laboratorio certificato e sicuro (cross-contamination)', bullet_style))
    story.append(Paragraph('• Brand e reputazione', bullet_style))
    story.append(Paragraph('• Relazioni con fornitori selezionati', bullet_style))

    story.append(Paragraph('11.8 Attivita Chiave', section_style))
    story.append(Paragraph('• Ricerca e sviluppo ricette', bullet_style))
    story.append(Paragraph('• Produzione artigianale', bullet_style))
    story.append(Paragraph('• Controllo qualita e sicurezza alimentare', bullet_style))
    story.append(Paragraph('• Comunicazione e storytelling', bullet_style))
    story.append(Paragraph('• Formazione continua su ingredienti e tecniche', bullet_style))

    story.append(Paragraph('11.9 Partner Chiave', section_style))
    story.append(Paragraph('• Fornitori di materie prime certificate', bullet_style))
    story.append(Paragraph('• Nutrizionisti e professionisti della salute', bullet_style))
    story.append(Paragraph('• Palestre, studi yoga, centri benessere', bullet_style))
    story.append(Paragraph('• Eventi locali e realta culturali', bullet_style))
    story.append(Paragraph('• Piattaforme di consegna (se attivate)', bullet_style))

    story.append(Paragraph('11.10 Struttura dei Costi', section_style))
    story.append(Paragraph('• Materie prime di alta qualita', bullet_style))
    story.append(Paragraph('• Costi di laboratorio e certificazioni', bullet_style))
    story.append(Paragraph('• Ricerca e sviluppo', bullet_style))
    story.append(Paragraph('• Packaging sostenibile', bullet_style))
    story.append(Paragraph('• Comunicazione e branding', bullet_style))
    story.append(Paragraph('• Formazione e aggiornamento', bullet_style))
    story.append(Paragraph('Posizionamento Sintetico: Una pasticceria che unisce gusto, inclusione e benessere, senza compromessi.', quote_style))
    story.append(PageBreak())

    # ============ CAPITOLO 12 ============
    story.append(Paragraph('CAPITOLO 12 - STRATEGIA DI MARKETING E COMUNICAZIONE', chapter_style))
    story.append(Paragraph('12.1 Obiettivi di Comunicazione', section_style))
    story.append(Paragraph('Creare una brand identity forte e trasparente.', body_style))

    story.append(Paragraph('12.2 Brand Identity del Laboratorio', section_style))
    story.append(Paragraph('Logo; shopper; packaging; bigliettini da visita etc.', body_style))
    story.append(Paragraph('[INSERIRE IMMAGINI DELLA BRAND IDENTITY]', body_style))

    story.append(Paragraph('12.3 Tone of Voice e Messaggi Chiave', section_style))
    story.append(Paragraph('<b>Da Evitare:</b>', body_style))
    story.append(Paragraph('• "Senza, senza, senza" (linguaggio di privazione)', bullet_style))
    story.append(Paragraph('• Moralismo salutista', bullet_style))
    story.append(Paragraph('• Troppa tecnicalita scientifica', bullet_style))
    story.append(Paragraph('<b>Da Usare:</b>', body_style))
    story.append(Paragraph('• Positivo', bullet_style))
    story.append(Paragraph('• Inclusivo', bullet_style))
    story.append(Paragraph('• Competente ma caldo', bullet_style))
    story.append(Paragraph('Non sei una dieta, sei una pasticceria che capisce le persone', quote_style))

    story.append(Paragraph('<b>Messaggi Chiave per Stile di Vita:</b>', subsection_style))
    story.append(Paragraph('<b>Impegnati Consapevoli:</b> "Dolci pensati per tutti, senza rinunce" - "La pasticceria che rispetta il corpo"', body_style))
    story.append(Paragraph('<b>Innovatori / Sperimentatori:</b> "Il dolce evolve" - "Nuovi ingredienti, nuove emozioni"', body_style))
    story.append(Paragraph('<b>Pragmatici della Salute:</b> "Buoni da mangiare, facili da digerire" - "Dolci che non ti appesantiscono"', body_style))

    story.append(Paragraph('12.4 Strategia di Comunicazione Online', section_style))
    story.append(Paragraph('<b>Social Media:</b>', subsection_style))
    story.append(Paragraph('<b>Instagram e Facebook:</b> Foto accattivanti dei tuoi dolci, dietro le quinte della preparazione, testimonianze dei clienti, e storie che mostrano la sicurezza e la qualita. Rispondere ai commenti, fare dirette Q&A, coinvolgere gli utenti con sondaggi e contest.', body_style))
    story.append(Paragraph('<b>YouTube e TikTok:</b> Video di ricette, tutorial passo-passo, interviste con esperti, e video informativi sui benefici dei tuoi prodotti. Rispondere ai commenti, collaborazioni con influencer del settore, creare playlist tematiche.', body_style))
    story.append(Paragraph('<b>Newsletter:</b> Offerte esclusive, novita, ricette, e storie di successo dei clienti. Incoraggiare feedback, sondaggi, e sconti personalizzati.', body_style))

    story.append(Paragraph('<b>Sviluppo Piattaforma E-commerce:</b>', subsection_style))
    story.append(Paragraph('• Scelta della piattaforma', bullet_style))
    story.append(Paragraph('• Design UX/UI', bullet_style))
    story.append(Paragraph('• Caricamento schede prodotto (foto, testi, prezzi)', bullet_style))
    story.append(Paragraph('• Configurazione metodi di pagamento e spedizione', bullet_style))

    story.append(Paragraph('<b>Attivita del Team Marketing:</b>', subsection_style))
    story.append(Paragraph('• Lo sviluppatore lavora sulla piattaforma, carica i prodotti e configura il checkout', bullet_style))
    story.append(Paragraph('• Il team marketing crea i contenuti (foto, descrizioni, video inerenti alla fase di produzione dei prodotti), e imposta le campagne pubblicitarie', bullet_style))

    story.append(Paragraph('12.5 Strategia di Comunicazione Offline', section_style))
    story.append(Paragraph('<b>Eventi e Degustazioni:</b> Organizzare eventi in laboratorio o in collaborazione con negozi di prodotti biologici, dove i clienti possano assaggiare e conoscere i tuoi dolci.', body_style))
    story.append(Paragraph('<b>Collaborazioni Locali:</b> Lavorare con palestre, studi di yoga, centri benessere, e ristoranti salutistici per creare sinergie e promozioni incrociate. Collaborazioni con nutrizionisti, dietisti, diabetologi, sportivi particolarmente attivi sui social-media.', body_style))
    story.append(Paragraph('<b>Partecipazione a Fiere e Mercati:</b> Essere presenti in eventi dedicati al cibo sano, al benessere e alle intolleranze, per far conoscere i tuoi prodotti.', body_style))
    story.append(Paragraph('<b>Materiale Promozionale:</b> Creare brochure, volantini e cartellonistica nei negozi partner, con informazioni chiare sui benefici dei tuoi dolci.', body_style))
    story.append(Paragraph('[INSERIRE TABELLA/GRAFICO CANALI PER STILE DI VITA EURISKO]', body_style))
    story.append(PageBreak())

    # ============ CAPITOLO 13 ============
    story.append(Paragraph('CAPITOLO 13 - ASPETTI OPERATIVI E ORGANIZZATIVI', chapter_style))
    story.append(Paragraph('13.1 Scelta della Location', section_style))
    story.append(Paragraph('Laboratorio situato in una zona periferica di REGGIO CALABRIA ben collegata con il centro della citta e facilmente raggiungibile da clienti e corrieri.', body_style))

    story.append(Paragraph('13.2 Organizzazione Interna del Laboratorio', section_style))
    story.append(Paragraph('• Un unico laboratorio a piano terra (tutti i prodotti sono certificati gluten free) fornito con tutte le attrezzature innovative necessarie', bullet_style))
    story.append(Paragraph('• Un magazzino per lo stoccaggio delle materie prime', bullet_style))
    story.append(Paragraph('• Una zona adibita al confezionamento dei prodotti finiti comunicante con il lab di produzione', bullet_style))
    story.append(Paragraph('• Una zona adibita allo stoccaggio dei prodotti finiti', bullet_style))
    story.append(Paragraph('• Un bagno dipendenti', bullet_style))
    story.append(Paragraph('• Uno spogliatoio', bullet_style))
    story.append(Paragraph('[INSERIRE PIANTINA LOCALE]', body_style))

    story.append(Paragraph('13.3 Risorse Umane e Ruoli', section_style))
    story.append(Paragraph('<b>Stakeholder:</b>', body_style))
    story.append(Paragraph('• Personale di laboratorio', bullet_style))
    story.append(Paragraph('• Consulenti esterni quali pasticceri esperti in prodotti alternativi inclusivi e salutistici, e tecnologi alimentari', bullet_style))
    story.append(Paragraph('• Fornitori', bullet_style))
    story.append(Paragraph('• Sponsor', bullet_style))
    story.append(Paragraph('• Corrieri', bullet_style))
    story.append(Paragraph('• Target di riferimento', bullet_style))
    story.append(Paragraph('• Esperti della comunicazione online e off-line', bullet_style))
    story.append(Paragraph('<b>Pianificazione delle Risorse:</b>', body_style))
    story.append(Paragraph('• Identificazione delle risorse necessarie: personale, attrezzature, materie prime, forniture esterne', bullet_style))
    story.append(Paragraph('• Assegnazione ruoli e responsabilita al team di progetto', bullet_style))
    story.append(Paragraph('• Formazione del personale di laboratorio', bullet_style))

    story.append(Paragraph('13.4 Logistica e Fornitori', section_style))
    story.append(Paragraph('• Selezione di fornitori, soprattutto quelli certificati per le materie prime prive di contaminazioni e di origine vegetale', bullet_style))
    story.append(Paragraph('• Ricerca di sponsor', bullet_style))
    story.append(Paragraph('• Contratti con i corrieri', bullet_style))
    story.append(Paragraph('• Progettazione di un packaging resistente, accattivante e informativo', bullet_style))
    story.append(Paragraph('<b>Attrezzature Chiave (Focus Inclusivo):</b>', body_style))
    story.append(Paragraph('• Forno professionale (meglio dedicato GF)', bullet_style))
    story.append(Paragraph('• Impastatrice/planetaria', bullet_style))
    story.append(Paragraph('• Frigoriferi e congelatori separati', bullet_style))
    story.append(Paragraph('• Tavoli inox e utensili dedicati (anti-contaminazione)', bullet_style))
    story.append(Paragraph('• Bilance di precisione', bullet_style))

    story.append(Paragraph('13.5 Sicurezza Alimentare e Certificazioni', section_style))
    story.append(Paragraph('• Analisi delle certificazioni necessarie (Es: AIC)', bullet_style))
    story.append(Paragraph('• Conformita HACCP e normative sanitarie', bullet_style))
    story.append(Paragraph('• Spazi e attrezzature idonee alla produzione separata (no contaminazioni)', bullet_style))
    story.append(Paragraph('• Linea gluten free certificabile', bullet_style))
    story.append(Paragraph('• Ricette validate (sicure, ripetibili, stabili)', bullet_style))
    story.append(Paragraph('• Etichettatura chiara e conforme alla normativa', bullet_style))
    story.append(PageBreak())

    # ============ CAPITOLO 14 ============
    story.append(Paragraph('CAPITOLO 14 - PIANIFICAZIONE ECONOMICO-FINANZIARIA', chapter_style))
    story.append(Paragraph('14.1 Investimenti Iniziali', section_style))
    story.append(Paragraph('<b>Totale Investimento Iniziale Stimato: 60.000 - 150.000 EUR</b>', body_style))

    story.append(Paragraph('14.2 Costi Operativi', section_style))
    story.append(Paragraph('<b>Costo Mensile Stimato: 7.800 - 18.300 EUR</b>', body_style))
    story.append(Paragraph('<b>Capitale di Sicurezza Consigliato:</b> Copertura 3-6 mesi di costi operativi: 25.000 - 80.000 EUR aggiuntivi', body_style))

    story.append(Paragraph('14.3 Modelli di Partenza del Laboratorio', section_style))
    story.append(Paragraph('• Laboratorio + delivery/ritiro: 60.000 - 90.000 EUR', bullet_style))
    story.append(Paragraph('• Laboratorio + vendita diretta: 90.000 - 150.000 EUR', bullet_style))

    story.append(Paragraph('14.4 Break Even Point', section_style))
    story.append(Paragraph('Raggiungere un break even point (punto di pareggio) entro i 18 mesi di attivita.', body_style))

    story.append(Paragraph('14.5 Sostenibilita Economica del Progetto', section_style))
    story.append(Paragraph('Il budget stanziato e sufficiente per la realizzazione del laboratorio, e del sito di acquisti online.', body_style))
    story.append(Paragraph('Si calcolano i costi associati a tutte le risorse e attivita pianificate, costruendo un budget dettagliato e realistico che sara poi monitorato durante l\'esecuzione.', body_style))
    story.append(PageBreak())

    # ============ CAPITOLO 15 ============
    story.append(Paragraph('CAPITOLO 15 - MATRICE MoSCoW', chapter_style))
    story.append(Paragraph('15.1 Introduzione alla Matrice MoSCoW', section_style))
    story.append(Paragraph('La matrice MoSCoW e uno strumento di prioritizzazione che classifica i requisiti in quattro categorie: Must Have, Should Have, Could Have, Won\'t Have.', body_style))

    story.append(Paragraph('15.2 Must Have', section_style))
    story.append(Paragraph('(Senza questi il laboratorio non puo partire)', body_style))
    story.append(Paragraph('• Conformita HACCP e normative sanitarie', bullet_style))
    story.append(Paragraph('• Spazi e attrezzature idonee alla produzione separata (no contaminazioni)', bullet_style))
    story.append(Paragraph('• Linea gluten free certificabile', bullet_style))
    story.append(Paragraph('• Ricette validate (sicure, ripetibili, stabili)', bullet_style))
    story.append(Paragraph('• Fornitori affidabili per materie prime "free from"', bullet_style))
    story.append(Paragraph('• Etichettatura chiara e conforme alla normativa', bullet_style))
    story.append(Paragraph('• Identita minima del brand (nome + logo + pay-off)', bullet_style))
    story.append(Paragraph('• Canale di vendita iniziale (laboratorio / vendita diretta)', bullet_style))
    story.append(Paragraph('Obiettivo: partire in sicurezza, credibilita e legalita.', quote_style))

    story.append(Paragraph('15.3 Should Have', section_style))
    story.append(Paragraph('(Molto importanti, ma rinviabili di poco)', body_style))
    story.append(Paragraph('• Linee lactose free e vegan complete', bullet_style))
    story.append(Paragraph('• Prodotti a basso indice glicemico strutturati', bullet_style))
    story.append(Paragraph('• Packaging sostenibile', bullet_style))
    story.append(Paragraph('• Presenza social di base (Instagram/Facebook)', bullet_style))
    story.append(Paragraph('• Storytelling sul valore inclusivo del laboratorio', bullet_style))
    story.append(Paragraph('• Collaborazioni locali (nutrizionisti, palestre, farmacie)', bullet_style))
    story.append(Paragraph('• Formazione continua su nutrizione e intolleranze', bullet_style))
    story.append(Paragraph('Obiettivo: rafforzare il posizionamento e la differenziazione.', quote_style))

    story.append(Paragraph('15.4 Could Have', section_style))
    story.append(Paragraph('(Aggiungono valore, ma non sono essenziali subito)', body_style))
    story.append(Paragraph('• E-commerce', bullet_style))
    story.append(Paragraph('• Personalizzazioni su richiesta (eventi, dolci su misura)', bullet_style))
    story.append(Paragraph('• Abbonamenti o box settimanali', bullet_style))
    story.append(Paragraph('• Laboratori didattici o corsi', bullet_style))
    story.append(Paragraph('• Packaging premium o stagionale', bullet_style))
    story.append(Paragraph('• Certificazioni aggiuntive (bio, sostenibilita)', bullet_style))
    story.append(Paragraph('Obiettivo: migliorare l\'esperienza e aumentare il valore medio.', quote_style))

    story.append(Paragraph('15.5 Won\'t Have', section_style))
    story.append(Paragraph('(Scelte consapevolmente rimandate)', body_style))
    story.append(Paragraph('• Franchising', bullet_style))
    story.append(Paragraph('• Distribuzione su larga scala', bullet_style))
    story.append(Paragraph('• Export', bullet_style))
    story.append(Paragraph('• Ampiezza eccessiva di gamma', bullet_style))
    story.append(Paragraph('• Comunicazione mass market', bullet_style))
    story.append(Paragraph('• Investimenti pubblicitari importanti', bullet_style))
    story.append(Paragraph('Obiettivo: mantenere focus, controllo e sostenibilita.', quote_style))

    story.append(Paragraph('15.6 Utilizzo della Matrice nella Gestione del Progetto', section_style))
    story.append(Paragraph('Questa MoSCoW ti permette di:', body_style))
    story.append(Paragraph('• Non disperdere risorse', bullet_style))
    story.append(Paragraph('• Difendere il progetto da richieste premature', bullet_style))
    story.append(Paragraph('• Spiegare chiaramente le priorita a soci o finanziatori', bullet_style))
    story.append(Paragraph('• Usarla in business plan o presentazioni', bullet_style))
    story.append(PageBreak())

    # ============ CAPITOLO 16 ============
    story.append(Paragraph('CAPITOLO 16 - ANALISI DEI RISCHI', chapter_style))
    story.append(Paragraph('16.1 Identificazione dei Rischi', section_style))
    story.append(Paragraph('Previsione dei potenziali problemi o imprevisti e sviluppo di strategie di mitigazione o piani di risposta.', body_style))

    story.append(Paragraph('16.2 Rischi Operativi', section_style))
    story.append(Paragraph('• Ritardo consegna da parte dei fornitori per assenza della materia prima alternativa difficile da reperire', bullet_style))
    story.append(Paragraph('• Difficolta nel reperire personale di laboratorio specializzato nella produzione di prodotti alternativi inclusivi e salutistici', bullet_style))

    story.append(Paragraph('16.3 Rischi di Mercato', section_style))
    story.append(Paragraph('• Costo elevato delle materie prime alternative e difficolta nella loro reperibilita', bullet_style))
    story.append(Paragraph('• Ancora molto scetticismo sulla bonta dei prodotti alternativi', bullet_style))
    story.append(Paragraph('• Associazione prodotti alternativi come prodotti per malati', bullet_style))

    story.append(Paragraph('16.4 Strategie di Mitigazione', section_style))
    story.append(Paragraph('• Individuazione di piu fornitori per l\'acquisto di una stessa materia prima', bullet_style))
    story.append(Paragraph('• Se un fornitore chiave ritarda la consegna per mancata disponibilita, si contatta un altro fornitore per non rimanere senza stock', bullet_style))
    story.append(Paragraph('• Diversificare i fornitori', bullet_style))
    story.append(Paragraph('• Creare partnership stabili', bullet_style))
    story.append(Paragraph('• Acquistare in volumi programmati', bullet_style))

    story.append(Paragraph('16.5 Monitoraggio dei Rischi', section_style))
    story.append(Paragraph('Si tiene sotto controllo l\'evolversi dei rischi identificati inizialmente e si cercano nuovi potenziali rischi che possono emergere durante l\'esecuzione.', body_style))
    story.append(PageBreak())

    # ============ CAPITOLO 17 ============
    story.append(Paragraph('CAPITOLO 17 - SOSTENIBILITA DEL PROGETTO', chapter_style))
    story.append(Paragraph('17.1 Sostenibilita Economica', section_style))
    story.append(Paragraph('• Il budget stanziato e sufficiente per la realizzazione del laboratorio', bullet_style))
    story.append(Paragraph('• Raggiungimento del break even point entro i 18 mesi di attivita', bullet_style))
    story.append(Paragraph('• Capitale di sicurezza per copertura 3-6 mesi di costi operativi', bullet_style))

    story.append(Paragraph('17.2 Sostenibilita Ambientale', section_style))
    story.append(Paragraph('• Packaging sostenibile', bullet_style))
    story.append(Paragraph('• Utilizzo di tecniche di lavorazione innovative che mirano a preservare il valore nutrizionale delle materie prime', bullet_style))
    story.append(Paragraph('• Attenzione alla sostenibilita ambientale in tutte le fasi del processo', bullet_style))

    story.append(Paragraph('17.3 Sostenibilita Etica e Sociale', section_style))
    story.append(Paragraph('• Sostenibilita etica, economica e ambientale come valore fondante', bullet_style))
    story.append(Paragraph('• Inclusivita come pilastro del progetto', bullet_style))
    story.append(Paragraph('• Accessibilita della pasticceria a persone con esigenze alimentari specifiche', bullet_style))
    story.append(PageBreak())

    # ============ CAPITOLO 18 ============
    story.append(Paragraph('CAPITOLO 18 - MONITORAGGIO E VALUTAZIONE', chapter_style))
    story.append(Paragraph('18.1 Monitoraggio delle Attivita', section_style))
    story.append(Paragraph('Processo continuo e sistematico che si svolge parallelamente alla fase di esecuzione.', body_style))
    story.append(Paragraph('<b>Monitoraggio delle tempistiche delle attivita pianificate:</b>', body_style))
    story.append(Paragraph('• Le attivita procedono secondo il cronoprogramma?', bullet_style))
    story.append(Paragraph('• Ci sono ritardi?', bullet_style))
    story.append(Paragraph('• Quali sono le attivita critiche che stanno eventualmente slittando?', bullet_style))
    story.append(Paragraph('<b>Monitoraggio vendite:</b>', body_style))
    story.append(Paragraph('• Vengono confrontate le vendite online settimanali con gli obiettivi mensili', bullet_style))

    story.append(Paragraph('18.2 Monitoraggio dei Costi', section_style))
    story.append(Paragraph('• Si tiene traccia delle spese effettive confrontandole con il budget preventivato', bullet_style))
    story.append(Paragraph('• Si calcola il burn rate (tasso di spesa) per prevedere se il progetto finira over budget', bullet_style))

    story.append(Paragraph('18.3 Valutazione dell\'Efficacia', section_style))
    story.append(Paragraph('Vengono analizzati i risultati ottenuti durante il progetto in concomitanza con la fase di monitoraggio, al fine di trarre eventuali insegnamenti per il futuro.', body_style))
    story.append(Paragraph('• Il progetto ha raggiunto gli obiettivi prefissati?', bullet_style))
    story.append(Paragraph('• I deliverable sono stati completati rispettando i requisiti di qualita, tempo e budget?', bullet_style))
    story.append(Paragraph('• I clienti sono soddisfatti dei risultati?', bullet_style))
    story.append(Paragraph('<b>Test qualita:</b>', body_style))
    story.append(Paragraph('Si eseguono verifiche e test per assicurarsi che i DELIVERABLE (prodotti intermedi o finali) soddisfino gli standard qualitativi e i requisiti concordati con il cliente', body_style))

    story.append(Paragraph('18.4 Valutazione dell\'Efficienza', section_style))
    story.append(Paragraph('• Le risorse sono state utilizzate in modo ottimale?', bullet_style))
    story.append(Paragraph('• I processi di lavoro sono stati efficienti?', bullet_style))
    story.append(PageBreak())

    # ============ CONCLUSIONI ============
    story.append(Paragraph('CONCLUSIONI', chapter_style))
    story.append(Paragraph('Considerazioni Finali sul Progetto', section_style))
    story.append(Spacer(1, 1*cm))
    story.append(Paragraph('<b>SENZA NON SIGNIFICA PEGGIORE.</b>', ParagraphStyle('Final1', parent=body_style, alignment=TA_CENTER, fontSize=12, textColor=dark_blue, fontName='Helvetica-Bold')))
    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph('<b>SENZA NON SIGNIFICA CHE HA QUALCOSA IN MENO.</b>', ParagraphStyle('Final2', parent=body_style, alignment=TA_CENTER, fontSize=12, textColor=dark_blue, fontName='Helvetica-Bold')))
    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph('<b>SIGNIFICA SOLO CAMBIARE PROSPETTIVA E IMPARARE A GIOCARE CON GLI INGREDIENTI.</b>', ParagraphStyle('Final3', parent=body_style, alignment=TA_CENTER, fontSize=12, textColor=dark_blue, fontName='Helvetica-Bold')))
    story.append(Spacer(1, 1*cm))

    story.append(Paragraph('Limiti del Progetto e Sviluppi Futuri', section_style))
    story.append(Paragraph('[Sezione da completare a cura dell\'autore]', body_style))
    story.append(PageBreak())

    # ============ PAGINA FINALE ============
    story.append(Spacer(1, 8*cm))
    story.append(Paragraph('PAYOFF', ParagraphStyle('PayoffTitle', parent=title_style, fontSize=24)))
    story.append(Spacer(1, 2*cm))
    story.append(Paragraph('"Dolci sani, belli, buoni... PER TUTTI"', ParagraphStyle('Payoff', parent=quote_style, fontSize=20, fontName='Helvetica-BoldOblique')))

    # Genera il PDF
    doc.build(story)
    return output_path

if __name__ == '__main__':
    try:
        output_file = create_pdf()
        print(f'PDF generato con successo: {output_file}')
    except Exception as e:
        import traceback
        print(f'Errore nella generazione del PDF: {e}')
        traceback.print_exc()
