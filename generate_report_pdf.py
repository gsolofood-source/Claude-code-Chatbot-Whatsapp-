#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script per generare il PDF del Business Plan
Laboratorio di Pasticceria Artigianale Inclusiva e Salutistica
"""

from fpdf import FPDF
import os

class PDFReport(FPDF):
    def __init__(self):
        super().__init__()
        self.set_auto_page_break(auto=True, margin=20)

    def header(self):
        if self.page_no() > 1:
            self.set_font('Helvetica', 'I', 8)
            self.set_text_color(128, 128, 128)
            self.cell(0, 10, 'Laboratorio di Pasticceria Artigianale Inclusiva e Salutistica', 0, 0, 'C')
            self.ln(15)

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f'Pagina {self.page_no()}', 0, 0, 'C')

    def chapter_title(self, title):
        self.set_font('Helvetica', 'B', 16)
        self.set_text_color(0, 51, 102)
        self.cell(0, 10, title, 0, 1, 'L')
        self.ln(5)

    def section_title(self, title):
        self.set_font('Helvetica', 'B', 12)
        self.set_text_color(0, 102, 153)
        self.cell(0, 8, title, 0, 1, 'L')
        self.ln(2)

    def subsection_title(self, title):
        self.set_font('Helvetica', 'B', 11)
        self.set_text_color(51, 51, 51)
        self.cell(0, 7, title, 0, 1, 'L')
        self.ln(2)

    def body_text(self, text):
        self.set_font('Helvetica', '', 10)
        self.set_text_color(0, 0, 0)
        self.multi_cell(0, 6, text)
        self.ln(3)

    def bullet_point(self, text):
        self.set_font('Helvetica', '', 10)
        self.set_text_color(0, 0, 0)
        self.cell(5, 6, '', 0, 0)
        self.cell(5, 6, chr(149), 0, 0)
        self.multi_cell(0, 6, text)

    def quote_text(self, text):
        self.set_font('Helvetica', 'I', 11)
        self.set_text_color(0, 102, 153)
        self.cell(10, 6, '', 0, 0)
        self.multi_cell(0, 6, text)
        self.ln(3)

    def table_header(self, headers, col_widths):
        self.set_font('Helvetica', 'B', 9)
        self.set_fill_color(0, 51, 102)
        self.set_text_color(255, 255, 255)
        for i, header in enumerate(headers):
            self.cell(col_widths[i], 8, header, 1, 0, 'C', True)
        self.ln()

    def table_row(self, data, col_widths):
        self.set_font('Helvetica', '', 9)
        self.set_text_color(0, 0, 0)
        self.set_fill_color(245, 245, 245)
        for i, cell in enumerate(data):
            self.cell(col_widths[i], 7, cell[:40] if len(cell) > 40 else cell, 1, 0, 'L')
        self.ln()

def create_pdf():
    pdf = PDFReport()

    # ============ COPERTINA ============
    pdf.add_page()
    pdf.ln(60)
    pdf.set_font('Helvetica', 'B', 28)
    pdf.set_text_color(0, 51, 102)
    pdf.multi_cell(0, 12, 'LABORATORIO DI PASTICCERIA\nARTIGIANALE INCLUSIVA\nE SALUTISTICA', 0, 'C')
    pdf.ln(10)
    pdf.set_font('Helvetica', '', 14)
    pdf.set_text_color(0, 102, 153)
    pdf.cell(0, 10, 'Gluten Free | Lactose Free | Vegan | Basso Indice Glicemico', 0, 1, 'C')
    pdf.ln(30)
    pdf.set_font('Helvetica', 'I', 16)
    pdf.set_text_color(0, 51, 102)
    pdf.cell(0, 10, '"Dolci sani, belli, buoni... PER TUTTI"', 0, 1, 'C')
    pdf.ln(40)
    pdf.set_font('Helvetica', '', 12)
    pdf.set_text_color(128, 128, 128)
    pdf.cell(0, 10, 'BUSINESS PLAN', 0, 1, 'C')

    # ============ INDICE ============
    pdf.add_page()
    pdf.chapter_title('INDICE')

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
        pdf.bullet_point(item)

    # ============ INTRODUZIONE GENERALE ============
    pdf.add_page()
    pdf.chapter_title('INTRODUZIONE GENERALE')

    pdf.section_title('Premessa e Contesto del Project Work')
    pdf.body_text('[Sezione da completare a cura dell\'autore]')

    pdf.section_title('Obiettivi del Progetto e Finalita dell\'Elaborato')
    pdf.body_text('[Sezione da completare a cura dell\'autore]')

    pdf.section_title('Metodologia di Lavoro Adottata')
    pdf.body_text('[Sezione da completare a cura dell\'autore]')

    # ============ CAPITOLO 1 ============
    pdf.add_page()
    pdf.chapter_title('CAPITOLO 1 - DESCRIZIONE DEL PROGETTO')

    pdf.section_title('1.1 Descrizione dell\'Idea Imprenditoriale')
    pdf.body_text('Nome Progetto: LABORATORIO DI PASTICCERIA ARTIGIANALE INCLUSIVA E SALUTISTICA (gluten free, lactose free, vegan, a basso indice glicemico)')

    pdf.section_title('1.2 Inquadramento del Laboratorio di Pasticceria Inclusiva e Salutistica')
    pdf.body_text('Rendere la pasticceria una dolce coccola alla portata di tutti, una pasticceria inclusiva e salutistica senza compromessi sulla qualita, gusto e estetica.')
    pdf.body_text('L\'accento e posto su:')
    pdf.bullet_point('L\'utilizzo di ingredienti di altissima qualita e dove possibile del territorio locale (es: bergamotto di Reggio Calabria dalle molteplici proprieta nutraceutiche)')
    pdf.bullet_point('Tecniche di produzione e stoccaggio innovative al fine di preservare quanto piu possibile le proprieta nutrizionali delle materie prime e prolungare la shelf-life dei prodotti finiti')
    pdf.bullet_point('Sostenibilita etica, economica e ambientale')

    pdf.section_title('1.3 Valori Fondanti del Progetto')
    pdf.bullet_point('L\'inclusivita')
    pdf.bullet_point('La qualita delle materie prime')
    pdf.bullet_point('La sicurezza alimentare in tutte le fasi della filiera (dall\'arrivo delle materie prime alla vendita del prodotto finito)')
    pdf.bullet_point('La sostenibilita etica, economica e ambientale')
    pdf.bullet_point('L\'utilizzo di tecniche di lavorazione innovative che mirano a preservare il valore nutrizionale delle materie prime')

    pdf.section_title('1.4 Mission del Laboratorio')
    pdf.body_text('Creare un laboratorio di pasticceria inclusiva e salutistica specializzato nella produzione di prodotti gluten free, lactose free, vegan, a basso indice glicemico, senza rinunciare alla qualita, al gusto e all\'estetica.')
    pdf.ln(5)
    pdf.quote_text('"CREARE DOLCI SANI, BUONI, E BELLI PER TUTTI"')
    pdf.body_text('Missione concisa, chiara, ispiratrice.')

    pdf.section_title('1.5 Vision di Medio-Lungo Periodo')
    pdf.body_text('Diventare punto di riferimento nazionale (IT) ed estero di pasticceria inclusiva e salutistica i cui caratteri distintivi sono:')
    pdf.bullet_point('L\'inclusivita')
    pdf.bullet_point('La qualita delle materie prime')
    pdf.bullet_point('La sicurezza alimentare in tutte le fasi della filiera (dall\'arrivo delle materie prime alla vendita del prodotto finito)')
    pdf.bullet_point('La sostenibilita etica, economica e ambientale')
    pdf.bullet_point('L\'utilizzo di tecniche di lavorazione innovative che mirano a preservare il valore nutrizionale delle materie prime')

    # ============ CAPITOLO 2 ============
    pdf.add_page()
    pdf.chapter_title('CAPITOLO 2 - ANALISI DEL CONTESTO DI MERCATO')

    pdf.section_title('2.1 Evoluzione del Settore Food e Bakery Artigianale')
    pdf.body_text('[Sezione da completare a cura dell\'autore]')

    pdf.section_title('2.2 Crescita del Mercato "Free From" e Salutistico')
    pdf.body_text('[INSERIRE GRAFICO GOOGLE TREND IN ITALIA E NEL MONDO]')

    pdf.section_title('2.3 Trend di Consumo: Inclusivita, Benessere e Sostenibilita')
    pdf.body_text('Il mercato dei prodotti alternativi inclusivi e salutistici e in forte crescita in Italia e nel mondo.')

    pdf.section_title('2.4 Analisi della Domanda e dei Bisogni Emergenti')
    pdf.body_text('[Sezione da completare a cura dell\'autore]')

    pdf.section_title('2.5 Analisi Preliminare del Mercato Italiano e Internazionale')
    pdf.body_text('[Sezione da completare a cura dell\'autore]')

    # ============ CAPITOLO 3 ============
    pdf.add_page()
    pdf.chapter_title('CAPITOLO 3 - DEFINIZIONE DEGLI OBIETTIVI')

    pdf.section_title('3.1 Obiettivi Generali del Progetto')
    pdf.body_text('Sviluppare una linea di pasticceria inclusiva e salutistica senza compromessi sulla qualita, gusto, estetica.')

    pdf.section_title('3.2 Obiettivi Specifici')
    pdf.bullet_point('Sviluppare uno shopping online prima dell\'apertura e aumentare le vendite online del 15% entro 3 mesi')
    pdf.bullet_point('Ottenere un sell-out (vendite effettive al consumatore) superiori al 50% nei primi tre mesi di lancio')
    pdf.bullet_point('Raggiungere un break even point (punto di pareggio) entro i 18 mesi di attivita')
    pdf.bullet_point('Ottenere le certificazioni necessarie prima dell\'apertura')
    pdf.bullet_point('Ottenere una lista cospicua di clienti prima dell\'apertura')

    pdf.section_title('3.3 Applicazione della Metodologia SMART')
    pdf.ln(3)
    pdf.subsection_title('SPECIFICO')
    pdf.body_text('Sviluppare una linea di pasticceria inclusiva e salutistica senza compromessi sulla qualita, gusto, estetica')

    pdf.subsection_title('TEMPORALE')
    pdf.body_text('Ottenere le certificazioni necessarie prima dell\'apertura; ottenere una lista cospicua di clienti prima dell\'apertura')

    pdf.subsection_title('MISURABILE')
    pdf.bullet_point('Sviluppare uno shopping online prima dell\'apertura e aumentare le vendite online del 15% entro 3 mesi')
    pdf.bullet_point('Ottenere un sell-out (vendite effettive al consumatore) superiori al 50% nei primi tre mesi di lancio')
    pdf.bullet_point('Raggiungere un break even point (punto di pareggio) entro i 18 mesi di attivita')

    pdf.subsection_title('RAGGIUNGIBILE')
    pdf.body_text('Il budget stanziato e sufficiente per la realizzazione del laboratorio, e del sito di acquisti online')

    pdf.subsection_title('RILEVANTE')
    pdf.body_text('Il mercato dei prodotti alternativi inclusivi e salutistici e in forte crescita in Italia e nel mondo')

    pdf.section_title('3.4 Indicatori di Performance (KPI)')
    pdf.bullet_point('Tasso di riacquisto clienti')
    pdf.bullet_point('Recensioni e passaparola')
    pdf.bullet_point('Margine per linea di prodotto')
    pdf.bullet_point('Crescita B2B')
    pdf.bullet_point('Coinvolgimento community')

    # ============ CAPITOLO 4 ============
    pdf.add_page()
    pdf.chapter_title('CAPITOLO 4 - ANALISI DEL TARGET')

    pdf.section_title('4.1 Segmentazione del Mercato')
    pdf.body_text('Il mercato viene segmentato in base a esigenze alimentari specifiche, scelte etiche, stili di vita orientati al benessere e canali B2B.')

    pdf.section_title('4.2 Target Primario B2C')
    pdf.bullet_point('Celiaci')
    pdf.bullet_point('Intolleranti al glutine e al lattosio')
    pdf.bullet_point('Allergici alle proteine del latte')
    pdf.bullet_point('Vegani')
    pdf.bullet_point('Diabetici e soggetti che per svariate patologie (es: donne con PCOS) devono mantenere bassi i livelli di glucosio nel sangue')

    pdf.section_title('4.3 Target Secondario B2C')
    pdf.bullet_point('Sportivi')
    pdf.bullet_point('Salutisti')

    pdf.section_title('4.4 Target B2B')
    pdf.bullet_point('B&B locali')
    pdf.bullet_point('Hotel boutique locali')
    pdf.bullet_point('Farmacie nazionali e estere')
    pdf.bullet_point('Palestre premium nazionali')

    pdf.section_title('4.5 Analisi dei Bisogni e delle Aspettative dei Clienti')
    pdf.subsection_title('Core Target:')
    pdf.bullet_point('Persone con intolleranze (celiachia, intolleranza al lattosio)')
    pdf.bullet_point('Clienti vegan o plant-based')
    pdf.bullet_point('Persone attente alla salute e alla prevenzione metabolica')

    pdf.subsection_title('Target Estesi:')
    pdf.bullet_point('Famiglie inclusive (un dolce per tutti)')
    pdf.bullet_point('Sportivi e professionisti attenti all\'energia e alla digeribilita')
    pdf.bullet_point('Clienti curiosi e innovatori del gusto')

    pdf.subsection_title('B2B:')
    pdf.bullet_point('Bar e locali che vogliono ampliare l\'offerta inclusiva')
    pdf.bullet_point('Studi professionali (nutrizionisti, palestre, centri benessere)')
    pdf.bullet_point('Eventi aziendali e catering consapevoli')

    # ============ CAPITOLO 5 ============
    pdf.add_page()
    pdf.chapter_title('CAPITOLO 5 - BUYER PERSONAS')

    pdf.section_title('5.1 Definizione delle Buyer Personas')
    pdf.body_text('Le Buyer Personas rappresentano archetipi dei clienti ideali, costruiti sulla base di caratteristiche demografiche, comportamentali e psicografiche.')

    pdf.section_title('5.2 Buyer Persona "Marta"')
    pdf.bullet_point('Eta: 35 anni')
    pdf.bullet_point('Professione: Insegnante di scuola primaria')
    pdf.bullet_point('Reddito: Medio-alto')
    pdf.bullet_point('Interessi: Alimentazione sana, benessere della famiglia, ricette senza glutine')
    pdf.bullet_point('Comportamento d\'acquisto: Preferisce prodotti certificati, fa acquisti sia online che in negozio, da valore alle recensioni')
    pdf.bullet_point('Canali preferiti: Social media come Instagram e Facebook, blog di cucina, newsletter')
    pdf.ln(3)
    pdf.body_text('[INSERIRE AVATAR DELLA BUYER PERSONA MARTA CREATO TRAMITE HUBSPOT]')
    pdf.ln(3)
    pdf.subsection_title('Cosa del VRIO la convince di piu:')
    pdf.bullet_point('Reputazione di laboratorio sicuro (contaminazioni controllate)')
    pdf.bullet_point('Know-how specializzato "free from"')
    pdf.subsection_title('Come usarlo:')
    pdf.bullet_point('Messaggi chiave: "Sicuro per tutta la famiglia", "certificato", "ingredienti trasparenti"')
    pdf.bullet_point('Canali: Instagram, Facebook, passaparola, sito con FAQ chiare')
    pdf.bullet_point('Prodotti ideali: torte da colazione, biscotti per bambini, dolci per feste')
    pdf.quote_text('Qui il VRIO diventa FIDUCIA')

    pdf.section_title('5.3 Buyer Persona "Luca"')
    pdf.bullet_point('Eta: 28 anni')
    pdf.bullet_point('Professione: Designer grafico')
    pdf.bullet_point('Reddito: Medio')
    pdf.bullet_point('Interessi: Cucina vegana, sostenibilita, tendenze alimentari etiche')
    pdf.bullet_point('Comportamento d\'acquisto: Acquista online, cerca prodotti innovativi, segue le tendenze')
    pdf.bullet_point('Canali preferiti: Instagram, YouTube, piattaforme di ricette vegane, community online')
    pdf.ln(3)
    pdf.subsection_title('Cosa del VRIO lo attrae:')
    pdf.bullet_point('Proposta di valore unica (vegano + salute)')
    pdf.bullet_point('Brand etico e inclusivo')
    pdf.subsection_title('Come usarlo:')
    pdf.bullet_point('Messaggi chiave: "Vegano, etico, buono davvero", "senza compromessi"')
    pdf.bullet_point('Canali: Instagram, YouTube, storytelling, collaborazioni')
    pdf.bullet_point('Prodotti ideali: monoporzioni moderne, dessert innovativi, limited edition')
    pdf.quote_text('Qui il VRIO diventa IDENTITA')

    pdf.add_page()
    pdf.section_title('5.4 Buyer Persona "Giulia"')
    pdf.bullet_point('Eta: 40 anni')
    pdf.bullet_point('Professione: Consulente finanziario')
    pdf.bullet_point('Reddito: Alto')
    pdf.bullet_point('Interessi: Benessere, alimentazione equilibrata, salute a lungo termine')
    pdf.bullet_point('Comportamento d\'acquisto: Predilige prodotti premium, presta attenzione agli ingredienti, acquista spesso in negozi specializzati')
    pdf.bullet_point('Canali preferiti: Blog di salute, newsletter, gruppi Facebook dedicati al benessere')
    pdf.ln(3)
    pdf.subsection_title('Cosa del VRIO la convince:')
    pdf.bullet_point('Know-how sul basso indice glicemico')
    pdf.bullet_point('Qualita premium e ricette studiate')
    pdf.subsection_title('Come usarlo:')
    pdf.bullet_point('Messaggi chiave: "Dolci che rispettano il tuo equilibrio"')
    pdf.bullet_point('Canali: newsletter, blog, consulenze, eventi')
    pdf.bullet_point('Prodotti ideali: dolci funzionali, dessert per colazione/merenda controllata')
    pdf.quote_text('Qui il VRIO diventa COMPETENZA')

    pdf.section_title('5.5 Ruolo delle Buyer Personas nella Strategia di Marketing')
    pdf.body_text('Il tuo laboratorio non vende solo dolci, ma:')
    pdf.bullet_point('Sicurezza (Marta)')
    pdf.bullet_point('Valori (Luca)')
    pdf.bullet_point('Benessere consapevole (Giulia)')
    pdf.quote_text('Questa e la base di un brand forte e difendibile.')

    # ============ CAPITOLO 6 ============
    pdf.add_page()
    pdf.chapter_title('CAPITOLO 6 - STRATEGIA COMPETITIVA')

    pdf.section_title('6.1 Posizionamento Strategico del Laboratorio')
    pdf.quote_text('"Un laboratorio di pasticceria che crea dolci inclusivi, buoni e intelligenti, pensati per il benessere di chi li mangia."')

    pdf.section_title('6.2 Strategia di Differenziazione Focalizzata')
    pdf.body_text('Il laboratorio opera in:')
    pdf.bullet_point('Un mercato di nicchia')
    pdf.bullet_point('Con buone difese competitive')
    pdf.bullet_point('E forte potenziale di differenziazione')
    pdf.ln(3)
    pdf.quote_text('Strategia consigliata: differenziazione focalizzata (Porter).')

    pdf.section_title('6.3 Elementi Distintivi Rispetto ai Competitor')
    pdf.body_text('Differenziarsi attraverso l\'ideazione e produzione di prodotti di pasticceria inclusivi e salutistici (dalla colazione alla coccola di fine pasto), mediante l\'utilizzo di materie prime alternative e di qualita:')
    pdf.ln(3)
    pdf.subsection_title('Farine alternative:')
    pdf.body_text('farine di riso, mais, avena, teff, grano saraceno, quinoa etc.')
    pdf.subsection_title('Grassi alternativi:')
    pdf.body_text('margarina senza grassi idrogenati, olio evo e olio di semi vari, grasso di cocco etc.')
    pdf.subsection_title('Zuccheri alternativi:')
    pdf.body_text('eritritolo, maltitolo, inulina, zucchero d\'agave, fruttosio')
    pdf.subsection_title('Proteine vegetali innovative')

    pdf.section_title('6.4 Coerenza tra Strategia e Valori del Progetto')
    pdf.body_text('Creare una brand identity forte e trasparente.')

    # ============ CAPITOLO 7 ============
    pdf.add_page()
    pdf.chapter_title('CAPITOLO 7 - ANALISI DEI COMPETITOR')

    pdf.section_title('7.1 Analisi dei Competitor Nazionali')

    pdf.subsection_title('1. Pansy (Milano)')
    pdf.body_text('Laboratorio/pasticceria che produce dolci e salati 100% gluten-free e lactose-free, con molte opzioni vegan. Focus su qualita artigianale, gusto gourmet e accoglienza inclusiva per intolleranze e scelte etiche.')

    pdf.subsection_title('2. Reti di laboratori gluten-free (Free Eat e analoghi)')
    pdf.body_text('Diverse realta italiane che operano come laboratori gluten free, spesso con prodotti 100% senza glutine e varianti senza lattosio e vegane. Esempi: Delishia, The Gluten Free Lab, Zero Farina, We Eat Gluten Free ecc.')

    pdf.subsection_title('3. LuigiAnna')
    pdf.body_text('Pasticceria artigianale che produce dolci e panetteria senza glutine e senza lattosio, con gamma di prodotti per privati e rivenditori. Si colloca piu sul gusto tradizionale rivisitato in chiave free-from.')

    pdf.subsection_title('4. Sweet and Fit Healthy Bakery (Napoli)')
    pdf.body_text('Concept di bakery con dolci gluten-free, vegan, proteici, e attenzione a ingredienti funzionali per esigenze alimentari.')

    pdf.section_title('7.2 Analisi dei Competitor Internazionali')

    pdf.subsection_title('5. French Meadow Bakery (USA)')
    pdf.body_text('Uno dei marchi storici di panetteria correlata alla salute negli USA: prodotti gluten-free, vegan, senza lievito, spesso certificati biologici e a basso indice glicemico.')

    pdf.subsection_title('6. Cinnaholic (USA/Canada)')
    pdf.body_text('Catena di bakery specializzata in dolci 100% vegan, lactose-free, egg-free con uso di ingredienti plant-based. Non e specificamente gluten-free, ma e un grande esempio globale di pasticceria inclusiva.')

    pdf.subsection_title('7. Askatu Bakery (USA)')
    pdf.body_text('Piccola bakery allergen-free a Seattle con prodotti gluten-free e vegan e riduzione delle principali allergie in menu.')

    pdf.subsection_title('8. GluteNull Bakery (Canada)')
    pdf.body_text('Produzione e vendita di prodotti gluten-free e vegan (panetteria, barrette, biscotti ecc.), con attenzione a ingredienti naturali e non-OGM.')

    pdf.subsection_title('9. Incredible Bakery Company (UK)')
    pdf.body_text('Bakery online e produttore di prodotti gluten-free, vegan e free-from per marketplace e B2B.')

    pdf.subsection_title('10. Fit Cake (Polonia & franchising)')
    pdf.body_text('Catena di pasticcerie senza zucchero, gluten-free, lactose-free e con molte opzioni vegan. E un modello di franchising presente in varie citta.')

    pdf.section_title('7.3 Confronto tra Modelli di Business')
    pdf.body_text('[INSERIRE GRAFICO]')
    pdf.body_text('Approcci e posizionamenti (per capire le differenze)')

    pdf.section_title('7.4 Posizionamento Competitivo del Laboratorio')
    pdf.body_text('Il posizionamento e di nicchia ma forte. Molti competitor sono:')
    pdf.bullet_point('Solo gluten free')
    pdf.bullet_point('Solo vegani')
    pdf.bullet_point('Non low GI')
    pdf.body_text('Il laboratorio si distingue per l\'offerta completa: gluten-free + lactose-free + vegan + low GI.')

    # ============ CAPITOLO 8 ============
    pdf.add_page()
    pdf.chapter_title('CAPITOLO 8 - ANALISI SWOT')

    pdf.section_title('8.1 Metodologia SWOT')
    pdf.body_text('L\'analisi SWOT permette di valutare i fattori interni (punti di forza e debolezza) e i fattori esterni (opportunita e minacce) che influenzano il progetto.')

    pdf.section_title('8.2 Punti di Forza (Strengths)')
    pdf.body_text('Pochi competitor sul mercato italiano e estero. Sono ancora pochi i professionisti esperti nella produzione di prodotti inclusivi e salutistici.')

    pdf.section_title('8.3 Punti di Debolezza (Weaknesses)')
    pdf.body_text('Ancora molto scetticismo sulla bonta dei prodotti alternativi. ASSOCIAZIONE PRODOTTI ALTERNATIVI COME PRODOTTI PER MALATI.')

    pdf.section_title('8.4 Opportunita (Opportunities)')
    pdf.body_text('Pochi competitor sul mercato italiano e estero e quindi ottime possibilita di emergere in breve tempo.')

    pdf.section_title('8.5 Minacce (Threats)')
    pdf.body_text('Costo elevato delle materie prime alternative e difficolta nella loro reperibilita - individuazione di piu fornitori per l\'acquisto di una stessa materia prima; difficolta nel reperire personale di laboratorio specializzato nella produzione di prodotti alternativi inclusivi e salutistici.')

    pdf.section_title('8.6 Sintesi Strategica della SWOT')
    pdf.body_text('FATTORI INTERNI:')
    pdf.bullet_point('PUNTI DI FORZA: Pochi competitor sul mercato italiano e estero. Sono ancora pochi i professionisti esperti nella produzione di prodotti inclusivi e salutistici.')
    pdf.bullet_point('PUNTI DI DEBOLEZZA: Ancora molto scetticismo sulla bonta dei prodotti alternativi. ASSOCIAZIONE PRODOTTI ALTERNATIVI COME PRODOTTI PER MALATI.')
    pdf.ln(3)
    pdf.body_text('FATTORI ESTERNI:')
    pdf.bullet_point('OPPORTUNITA: Pochi competitor sul mercato italiano e estero e quindi ottime possibilita di emergere in breve tempo.')
    pdf.bullet_point('MINACCE: Costo elevato delle materie prime alternative e difficolta nella loro reperibilita.')

    # ============ CAPITOLO 9 ============
    pdf.add_page()
    pdf.chapter_title('CAPITOLO 9 - ANALISI VRIO')

    pdf.section_title('9.1 Introduzione al Modello VRIO')
    pdf.body_text('Il modello VRIO valuta le risorse aziendali secondo quattro criteri: Valore, Rarita, Imitabilita e Organizzazione.')

    pdf.section_title('9.2 Analisi delle Risorse Chiave')

    pdf.subsection_title('1. Know-how Specializzato in Pasticceria "Free From" e Low GI')
    pdf.bullet_point('Valore (V): Si - Risponde a bisogni reali (celiachia, intolleranze, veganismo, controllo glicemico)')
    pdf.bullet_point('Rarita (R): Si - Pochi laboratori uniscono tutte queste caratteristiche insieme')
    pdf.bullet_point('Imitabilita (I): Medio-bassa - Richiede studio, sperimentazione, errori, competenze tecniche elevate')
    pdf.bullet_point('Organizzazione (O): Si (se strutturi ricette, processi e formazione)')
    pdf.quote_text('Vantaggio competitivo potenzialmente sostenibile')

    pdf.subsection_title('2. Proposta di Valore Unica (Senza Glutine + Senza Lattosio + Vegano + Low GI)')
    pdf.bullet_point('Valore: Si - E una proposta chiara, distintiva e orientata al benessere')
    pdf.bullet_point('Rarita: Alta - Molti fanno "senza glutine" o "vegano", pochissimi tutto insieme')
    pdf.bullet_point('Imitabilita: Media - Copiabile nel tempo, ma non facilmente se manca la competenza')
    pdf.bullet_point('Organizzazione: Si - Deve essere comunicata bene (branding, storytelling, certificazioni)')
    pdf.quote_text('Vantaggio competitivo temporaneo - sostenibile se rafforzato dal brand')

    pdf.subsection_title('3. Reputazione di Laboratorio Sicuro e Affidabile')
    pdf.body_text('(certificazioni, attenzione alle contaminazioni, trasparenza)')
    pdf.bullet_point('Valore: Molto alto - Fondamentale per celiaci, diabetici e famiglie')
    pdf.bullet_point('Rarita: Media - Non tutti investono davvero nella sicurezza')
    pdf.bullet_point('Imitabilita: Difficile - La fiducia si costruisce nel tempo')
    pdf.bullet_point('Organizzazione: Si - Procedure, controlli, formazione')
    pdf.quote_text('Vantaggio competitivo sostenibile')

    pdf.add_page()
    pdf.subsection_title('4. Ricette Proprietarie e Gusto Elevato')
    pdf.bullet_point('Valore: Si - Il gusto e decisivo, soprattutto nel "free from"')
    pdf.bullet_point('Rarita: Media - Dipende dalla tua creativita')
    pdf.bullet_point('Imitabilita: Media - Le ricette si possono copiare, l\'esperienza no')
    pdf.bullet_point('Organizzazione: Si - Se documenti e proteggi il tuo metodo')
    pdf.quote_text('Parita competitiva - diventa vantaggio se unita al brand')

    pdf.subsection_title('5. Brand Posizionato su Salute, Inclusivita ed Etica')
    pdf.bullet_point('Valore: Si - Attira clienti consapevoli e fidelizzati')
    pdf.bullet_point('Rarita: Media - Sempre piu brand parlano di salute, pochi lo fanno in modo coerente')
    pdf.bullet_point('Imitabilita: Difficile - I valori autentici non si copiano')
    pdf.bullet_point('Organizzazione: Si - Comunicazione coerente online e offline')
    pdf.quote_text('Vantaggio competitivo sostenibile')

    pdf.section_title('9.3 Valutazione del Vantaggio Competitivo')
    pdf.body_text('Il tuo laboratorio ha un forte potenziale di vantaggio competitivo sostenibile, soprattutto se punti su:')
    pdf.bullet_point('Competenze tecniche elevate')
    pdf.bullet_point('Sicurezza e fiducia')
    pdf.bullet_point('Proposta di valore chiara')
    pdf.bullet_point('Branding coerente')

    pdf.section_title('9.4 Implicazioni Strategiche del Modello VRIO')
    pdf.body_text('Il modello VRIO dimostra che il laboratorio possiede risorse in grado di generare vantaggi competitivi sostenibili, in particolare attraverso il know-how specializzato, la reputazione di sicurezza e il brand posizionato su valori autentici.')

    # ============ CAPITOLO 10 ============
    pdf.add_page()
    pdf.chapter_title('CAPITOLO 10 - MODELLO DELLE 5 FORZE DI PORTER')

    pdf.section_title('10.1 Descrizione del Modello')
    pdf.body_text('Il modello delle 5 Forze di Porter analizza l\'intensita competitiva e l\'attrattivita di un settore industriale.')

    pdf.section_title('10.2 Minaccia di Nuovi Entranti')
    pdf.body_text('Intensita: MEDIA')
    pdf.body_text('Perche: Il settore food e accessibile, ma il tuo posizionamento richiede:')
    pdf.bullet_point('Competenze tecniche elevate')
    pdf.bullet_point('Investimenti in formazione')
    pdf.bullet_point('Attenzione alle contaminazioni')
    pdf.bullet_point('Reputazione e fiducia')
    pdf.ln(3)
    pdf.body_text('Barriere all\'ingresso:')
    pdf.bullet_point('Know-how "free from" + low GI')
    pdf.bullet_point('Certificazioni')
    pdf.bullet_point('Brand e fiducia costruita nel tempo')
    pdf.quote_text('Conclusione: Non e facile replicarti velocemente.')

    pdf.section_title('10.3 Potere Contrattuale dei Fornitori')
    pdf.body_text('Intensita: MEDIO-ALTA')
    pdf.body_text('Perche:')
    pdf.bullet_point('Materie prime specifiche (farine GF, dolcificanti low GI, ingredienti vegani)')
    pdf.bullet_point('Pochi fornitori altamente specializzati')
    pdf.bullet_point('Prezzi piu alti rispetto agli ingredienti tradizionali')
    pdf.ln(3)
    pdf.body_text('Strategia di difesa:')
    pdf.bullet_point('Diversificare i fornitori')
    pdf.bullet_point('Creare partnership stabili')
    pdf.bullet_point('Acquistare in volumi programmati')

    pdf.section_title('10.4 Potere Contrattuale dei Clienti')
    pdf.body_text('Intensita: MEDIA')
    pdf.body_text('Perche:')
    pdf.bullet_point('Clienti informati e attenti')
    pdf.bullet_point('Sensibilita al prezzo, ma')
    pdf.bullet_point('Alta disponibilita a pagare per sicurezza e qualita')
    pdf.quote_text('Punto chiave: Se costruisci fiducia, il prezzo diventa secondario.')

    pdf.section_title('10.5 Minaccia di Prodotti Sostitutivi')
    pdf.body_text('Intensita: MEDIA')
    pdf.body_text('Sostituti possibili:')
    pdf.bullet_point('Dolci industriali "free from"')
    pdf.bullet_point('Autoproduzione casalinga')
    pdf.bullet_point('Prodotti salutistici non artigianali')
    pdf.ln(3)
    pdf.body_text('Tuo vantaggio:')
    pdf.bullet_point('Artigianalita')
    pdf.bullet_point('Freschezza')
    pdf.bullet_point('Sicurezza')
    pdf.bullet_point('Esperienza emotiva')

    pdf.add_page()
    pdf.section_title('10.6 Intensita della Concorrenza')
    pdf.body_text('Intensita: MEDIO-BASSA (localmente)')
    pdf.body_text('Perche:')
    pdf.bullet_point('Pochi laboratori cosi specializzati')
    pdf.bullet_point('Molti competitor sono: Solo gluten free, Solo vegani, Non low GI')
    pdf.quote_text('Il tuo posizionamento e di nicchia ma forte.')

    pdf.section_title('10.7 Sintesi dell\'Analisi Competitiva')
    pdf.body_text('Riepilogo delle 5 Forze:')
    pdf.bullet_point('Minaccia nuovi entranti: Media')
    pdf.bullet_point('Potere fornitori: Medio-Alta')
    pdf.bullet_point('Potere clienti: Media')
    pdf.bullet_point('Prodotti sostitutivi: Media')
    pdf.bullet_point('Concorrenza: Medio-Bassa')
    pdf.ln(5)
    pdf.body_text('Conclusione Chiave:')
    pdf.body_text('Il tuo laboratorio opera in:')
    pdf.bullet_point('Un mercato di nicchia')
    pdf.bullet_point('Con buone difese competitive')
    pdf.bullet_point('E forte potenziale di differenziazione')
    pdf.quote_text('Strategia consigliata: differenziazione focalizzata (Porter).')

    # ============ CAPITOLO 11 ============
    pdf.add_page()
    pdf.chapter_title('CAPITOLO 11 - BUSINESS MODEL CANVAS')

    pdf.section_title('11.1 Introduzione al Business Model Canvas')
    pdf.body_text('Il Business Model Canvas e uno strumento strategico che permette di descrivere, visualizzare e progettare modelli di business attraverso nove blocchi fondamentali.')
    pdf.body_text('Ho creato il Business Model Canvas completo del tuo laboratorio nel canvas qui accanto.')

    pdf.section_title('11.2 Proposta di Valore')
    pdf.bullet_point('Dolci artigianali inclusivi, pensati per persone con intolleranze, scelte etiche o esigenze metaboliche')
    pdf.bullet_point('Pasticceria salutistica ma golosa, senza senso di rinuncia')
    pdf.bullet_point('Ricette a basso indice glicemico per benessere quotidiano e stabilita energetica')
    pdf.bullet_point('Trasparenza totale su ingredienti, processi e benefici')
    pdf.bullet_point('Design, gusto ed esperienza al pari dell\'alta pasticceria tradizionale')

    pdf.section_title('11.3 Segmenti di Clientela')
    pdf.subsection_title('Core Target:')
    pdf.bullet_point('Persone con intolleranze (celiachia, intolleranza al lattosio)')
    pdf.bullet_point('Clienti vegan o plant-based')
    pdf.bullet_point('Persone attente alla salute e alla prevenzione metabolica')
    pdf.subsection_title('Target Estesi:')
    pdf.bullet_point('Famiglie inclusive (un dolce per tutti)')
    pdf.bullet_point('Sportivi e professionisti attenti all\'energia e alla digeribilita')
    pdf.bullet_point('Clienti curiosi e innovatori del gusto')
    pdf.subsection_title('B2B:')
    pdf.bullet_point('Bar e locali che vogliono ampliare l\'offerta inclusiva')
    pdf.bullet_point('Studi professionali (nutrizionisti, palestre, centri benessere)')
    pdf.bullet_point('Eventi aziendali e catering consapevoli')

    pdf.section_title('11.4 Canali')
    pdf.bullet_point('Vendita diretta in laboratorio')
    pdf.bullet_point('Prenotazioni e ordini su richiesta')
    pdf.bullet_point('Social media (Instagram, storytelling visivo)')
    pdf.bullet_point('Google Maps e recensioni locali')
    pdf.bullet_point('Eventi, mercati, collaborazioni territoriali')
    pdf.bullet_point('B2B: contatto diretto e partnership')

    pdf.section_title('11.5 Relazioni con i Clienti')
    pdf.bullet_point('Relazione umana e fiduciaria')
    pdf.bullet_point('Educazione gentile al benessere (non medicalizzata)')
    pdf.bullet_point('Personalizzazione su esigenze specifiche')
    pdf.bullet_point('Community locale (eventi, degustazioni)')
    pdf.bullet_point('Ascolto attivo e feedback continuo')

    pdf.add_page()
    pdf.section_title('11.6 Flussi di Ricavo')
    pdf.bullet_point('Vendita dolci monoporzione e torte')
    pdf.bullet_point('Ordini personalizzati (eventi, compleanni, ricorrenze)')
    pdf.bullet_point('Forniture B2B')
    pdf.bullet_point('Box degustazione tematiche')
    pdf.bullet_point('Workshop e laboratori (educativi / esperienziali)')

    pdf.section_title('11.7 Risorse Chiave')
    pdf.bullet_point('Know-how in pasticceria inclusiva e salutistica')
    pdf.bullet_point('Ricette proprietarie a basso IG')
    pdf.bullet_point('Laboratorio certificato e sicuro (cross-contamination)')
    pdf.bullet_point('Brand e reputazione')
    pdf.bullet_point('Relazioni con fornitori selezionati')

    pdf.section_title('11.8 Attivita Chiave')
    pdf.bullet_point('Ricerca e sviluppo ricette')
    pdf.bullet_point('Produzione artigianale')
    pdf.bullet_point('Controllo qualita e sicurezza alimentare')
    pdf.bullet_point('Comunicazione e storytelling')
    pdf.bullet_point('Formazione continua su ingredienti e tecniche')

    pdf.section_title('11.9 Partner Chiave')
    pdf.bullet_point('Fornitori di materie prime certificate')
    pdf.bullet_point('Nutrizionisti e professionisti della salute')
    pdf.bullet_point('Palestre, studi yoga, centri benessere')
    pdf.bullet_point('Eventi locali e realta culturali')
    pdf.bullet_point('Piattaforme di consegna (se attivate)')

    pdf.section_title('11.10 Struttura dei Costi')
    pdf.bullet_point('Materie prime di alta qualita')
    pdf.bullet_point('Costi di laboratorio e certificazioni')
    pdf.bullet_point('Ricerca e sviluppo')
    pdf.bullet_point('Packaging sostenibile')
    pdf.bullet_point('Comunicazione e branding')
    pdf.bullet_point('Formazione e aggiornamento')
    pdf.ln(5)
    pdf.quote_text('Posizionamento Sintetico: Una pasticceria che unisce gusto, inclusione e benessere, senza compromessi.')

    # ============ CAPITOLO 12 ============
    pdf.add_page()
    pdf.chapter_title('CAPITOLO 12 - STRATEGIA DI MARKETING E COMUNICAZIONE')

    pdf.section_title('12.1 Obiettivi di Comunicazione')
    pdf.body_text('Creare una brand identity forte e trasparente.')

    pdf.section_title('12.2 Brand Identity del Laboratorio')
    pdf.body_text('Logo; shopper; packaging; bigliettini da visita etc.')
    pdf.body_text('[INSERIRE IMMAGINI DELLA BRAND IDENTITY]')

    pdf.section_title('12.3 Tone of Voice e Messaggi Chiave')
    pdf.subsection_title('Da Evitare:')
    pdf.bullet_point('"Senza, senza, senza" (linguaggio di privazione)')
    pdf.bullet_point('Moralismo salutista')
    pdf.bullet_point('Troppa tecnicalita scientifica')
    pdf.subsection_title('Da Usare:')
    pdf.bullet_point('Positivo')
    pdf.bullet_point('Inclusivo')
    pdf.bullet_point('Competente ma caldo')
    pdf.quote_text('Non sei una dieta, sei una pasticceria che capisce le persone')

    pdf.subsection_title('Messaggi Chiave per Stile di Vita')
    pdf.body_text('Impegnati Consapevoli:')
    pdf.quote_text('"Dolci pensati per tutti, senza rinunce" - "La pasticceria che rispetta il corpo"')
    pdf.body_text('Innovatori / Sperimentatori:')
    pdf.quote_text('"Il dolce evolve" - "Nuovi ingredienti, nuove emozioni"')
    pdf.body_text('Pragmatici della Salute:')
    pdf.quote_text('"Buoni da mangiare, facili da digerire" - "Dolci che non ti appesantiscono"')

    pdf.section_title('12.4 Strategia di Comunicazione Online')
    pdf.subsection_title('Social Media')
    pdf.body_text('Instagram e Facebook: Foto accattivanti dei tuoi dolci, dietro le quinte della preparazione, testimonianze dei clienti, e storie che mostrano la sicurezza e la qualita. Rispondere ai commenti, fare dirette Q&A, coinvolgere gli utenti con sondaggi e contest.')
    pdf.body_text('YouTube e TikTok: Video di ricette, tutorial passo-passo, interviste con esperti, e video informativi sui benefici dei tuoi prodotti. Rispondere ai commenti, collaborazioni con influencer del settore, creare playlist tematiche.')
    pdf.body_text('Newsletter: Offerte esclusive, novita, ricette, e storie di successo dei clienti. Incoraggiare feedback, sondaggi, e sconti personalizzati.')

    pdf.subsection_title('Sviluppo Piattaforma E-commerce')
    pdf.bullet_point('Scelta della piattaforma')
    pdf.bullet_point('Design UX/UI')
    pdf.bullet_point('Caricamento schede prodotto (foto, testi, prezzi)')
    pdf.bullet_point('Configurazione metodi di pagamento e spedizione')

    pdf.subsection_title('Attivita del Team Marketing')
    pdf.bullet_point('Lo sviluppatore lavora sulla piattaforma, carica i prodotti e configura il checkout')
    pdf.bullet_point('Il team marketing crea i contenuti (foto, descrizioni, video inerenti alla fase di produzione dei prodotti), e imposta le campagne pubblicitarie')

    pdf.add_page()
    pdf.section_title('12.5 Strategia di Comunicazione Offline')
    pdf.subsection_title('Eventi e Degustazioni')
    pdf.body_text('Organizzare eventi in laboratorio o in collaborazione con negozi di prodotti biologici, dove i clienti possano assaggiare e conoscere i tuoi dolci.')
    pdf.subsection_title('Collaborazioni Locali')
    pdf.body_text('Lavorare con palestre, studi di yoga, centri benessere, e ristoranti salutistici per creare sinergie e promozioni incrociate. Collaborazioni con nutrizionisti, dietisti, diabetologi, sportivi particolarmente attivi sui social-media.')
    pdf.subsection_title('Partecipazione a Fiere e Mercati')
    pdf.body_text('Essere presenti in eventi dedicati al cibo sano, al benessere e alle intolleranze, per far conoscere i tuoi prodotti.')
    pdf.subsection_title('Materiale Promozionale')
    pdf.body_text('Creare brochure, volantini e cartellonistica nei negozi partner, con informazioni chiare sui benefici dei tuoi dolci.')
    pdf.body_text('[INSERIRE TABELLA/GRAFICO CANALI PER STILE DI VITA EURISKO]')

    # ============ CAPITOLO 13 ============
    pdf.add_page()
    pdf.chapter_title('CAPITOLO 13 - ASPETTI OPERATIVI E ORGANIZZATIVI')

    pdf.section_title('13.1 Scelta della Location')
    pdf.body_text('Laboratorio situato in una zona periferica di REGGIO CALABRIA ben collegata con il centro della citta e facilmente raggiungibile da clienti e corrieri.')

    pdf.section_title('13.2 Organizzazione Interna del Laboratorio')
    pdf.bullet_point('Un unico laboratorio a piano terra (tutti i prodotti sono certificati gluten free) fornito con tutte le attrezzature innovative necessarie')
    pdf.bullet_point('Un magazzino per lo stoccaggio delle materie prime')
    pdf.bullet_point('Una zona adibita al confezionamento dei prodotti finiti comunicante con il lab di produzione')
    pdf.bullet_point('Una zona adibita allo stoccaggio dei prodotti finiti')
    pdf.bullet_point('Un bagno dipendenti')
    pdf.bullet_point('Uno spogliatoio')
    pdf.body_text('[INSERIRE PIANTINA LOCALE]')

    pdf.section_title('13.3 Risorse Umane e Ruoli')
    pdf.subsection_title('Stakeholder')
    pdf.bullet_point('Personale di laboratorio')
    pdf.bullet_point('Consulenti esterni quali pasticceri esperti in prodotti alternativi inclusivi e salutistici, e tecnologi alimentari')
    pdf.bullet_point('Fornitori')
    pdf.bullet_point('Sponsor')
    pdf.bullet_point('Corrieri')
    pdf.bullet_point('Target di riferimento')
    pdf.bullet_point('Esperti della comunicazione online e off-line')
    pdf.subsection_title('Pianificazione delle Risorse')
    pdf.bullet_point('Identificazione delle risorse necessarie: personale, attrezzature, materie prime, forniture esterne')
    pdf.bullet_point('Assegnazione ruoli e responsabilita al team di progetto')
    pdf.bullet_point('Formazione del personale di laboratorio')

    pdf.section_title('13.4 Logistica e Fornitori')
    pdf.bullet_point('Selezione di fornitori, soprattutto quelli certificati per le materie prime prive di contaminazioni e di origine vegetale')
    pdf.bullet_point('Ricerca di sponsor')
    pdf.bullet_point('Contratti con i corrieri')
    pdf.bullet_point('Progettazione di un packaging resistente, accattivante e informativo')
    pdf.subsection_title('Attrezzature Chiave (Focus Inclusivo)')
    pdf.bullet_point('Forno professionale (meglio dedicato GF)')
    pdf.bullet_point('Impastatrice/planetaria')
    pdf.bullet_point('Frigoriferi e congelatori separati')
    pdf.bullet_point('Tavoli inox e utensili dedicati (anti-contaminazione)')
    pdf.bullet_point('Bilance di precisione')

    pdf.section_title('13.5 Sicurezza Alimentare e Certificazioni')
    pdf.bullet_point('Analisi delle certificazioni necessarie (Es: AIC)')
    pdf.bullet_point('Conformita HACCP e normative sanitarie')
    pdf.bullet_point('Spazi e attrezzature idonee alla produzione separata (no contaminazioni)')
    pdf.bullet_point('Linea gluten free certificabile')
    pdf.bullet_point('Ricette validate (sicure, ripetibili, stabili)')
    pdf.bullet_point('Etichettatura chiara e conforme alla normativa')

    # ============ CAPITOLO 14 ============
    pdf.add_page()
    pdf.chapter_title('CAPITOLO 14 - PIANIFICAZIONE ECONOMICO-FINANZIARIA')

    pdf.section_title('14.1 Investimenti Iniziali')
    pdf.body_text('Totale Investimento Iniziale Stimato: 60.000 - 150.000 EUR')

    pdf.section_title('14.2 Costi Operativi')
    pdf.body_text('Costo Mensile Stimato: 7.800 - 18.300 EUR')
    pdf.ln(3)
    pdf.subsection_title('Capitale di Sicurezza Consigliato')
    pdf.body_text('Copertura 3-6 mesi di costi operativi: 25.000 - 80.000 EUR aggiuntivi')

    pdf.section_title('14.3 Modelli di Partenza del Laboratorio')
    pdf.bullet_point('Laboratorio + delivery/ritiro: 60.000 - 90.000 EUR')
    pdf.bullet_point('Laboratorio + vendita diretta: 90.000 - 150.000 EUR')

    pdf.section_title('14.4 Break Even Point')
    pdf.body_text('Raggiungere un break even point (punto di pareggio) entro i 18 mesi di attivita.')

    pdf.section_title('14.5 Sostenibilita Economica del Progetto')
    pdf.body_text('Il budget stanziato e sufficiente per la realizzazione del laboratorio, e del sito di acquisti online.')
    pdf.body_text('Si calcolano i costi associati a tutte le risorse e attivita pianificate, costruendo un budget dettagliato e realistico che sara poi monitorato durante l\'esecuzione.')

    # ============ CAPITOLO 15 ============
    pdf.add_page()
    pdf.chapter_title('CAPITOLO 15 - MATRICE MoSCoW')

    pdf.section_title('15.1 Introduzione alla Matrice MoSCoW')
    pdf.body_text('La matrice MoSCoW e uno strumento di prioritizzazione che classifica i requisiti in quattro categorie: Must Have, Should Have, Could Have, Won\'t Have.')

    pdf.section_title('15.2 Must Have')
    pdf.body_text('(Senza questi il laboratorio non puo partire)')
    pdf.bullet_point('Conformita HACCP e normative sanitarie')
    pdf.bullet_point('Spazi e attrezzature idonee alla produzione separata (no contaminazioni)')
    pdf.bullet_point('Linea gluten free certificabile')
    pdf.bullet_point('Ricette validate (sicure, ripetibili, stabili)')
    pdf.bullet_point('Fornitori affidabili per materie prime "free from"')
    pdf.bullet_point('Etichettatura chiara e conforme alla normativa')
    pdf.bullet_point('Identita minima del brand (nome + logo + pay-off)')
    pdf.bullet_point('Canale di vendita iniziale (laboratorio / vendita diretta)')
    pdf.quote_text('Obiettivo: partire in sicurezza, credibilita e legalita.')

    pdf.section_title('15.3 Should Have')
    pdf.body_text('(Molto importanti, ma rinviabili di poco)')
    pdf.bullet_point('Linee lactose free e vegan complete')
    pdf.bullet_point('Prodotti a basso indice glicemico strutturati')
    pdf.bullet_point('Packaging sostenibile')
    pdf.bullet_point('Presenza social di base (Instagram/Facebook)')
    pdf.bullet_point('Storytelling sul valore inclusivo del laboratorio')
    pdf.bullet_point('Collaborazioni locali (nutrizionisti, palestre, farmacie)')
    pdf.bullet_point('Formazione continua su nutrizione e intolleranze')
    pdf.quote_text('Obiettivo: rafforzare il posizionamento e la differenziazione.')

    pdf.section_title('15.4 Could Have')
    pdf.body_text('(Aggiungono valore, ma non sono essenziali subito)')
    pdf.bullet_point('E-commerce')
    pdf.bullet_point('Personalizzazioni su richiesta (eventi, dolci su misura)')
    pdf.bullet_point('Abbonamenti o box settimanali')
    pdf.bullet_point('Laboratori didattici o corsi')
    pdf.bullet_point('Packaging premium o stagionale')
    pdf.bullet_point('Certificazioni aggiuntive (bio, sostenibilita)')
    pdf.quote_text('Obiettivo: migliorare l\'esperienza e aumentare il valore medio.')

    pdf.add_page()
    pdf.section_title('15.5 Won\'t Have')
    pdf.body_text('(Scelte consapevolmente rimandate)')
    pdf.bullet_point('Franchising')
    pdf.bullet_point('Distribuzione su larga scala')
    pdf.bullet_point('Export')
    pdf.bullet_point('Ampiezza eccessiva di gamma')
    pdf.bullet_point('Comunicazione mass market')
    pdf.bullet_point('Investimenti pubblicitari importanti')
    pdf.quote_text('Obiettivo: mantenere focus, controllo e sostenibilita.')

    pdf.section_title('15.6 Utilizzo della Matrice nella Gestione del Progetto')
    pdf.body_text('Questa MoSCoW ti permette di:')
    pdf.bullet_point('Non disperdere risorse')
    pdf.bullet_point('Difendere il progetto da richieste premature')
    pdf.bullet_point('Spiegare chiaramente le priorita a soci o finanziatori')
    pdf.bullet_point('Usarla in business plan o presentazioni')

    # ============ CAPITOLO 16 ============
    pdf.add_page()
    pdf.chapter_title('CAPITOLO 16 - ANALISI DEI RISCHI')

    pdf.section_title('16.1 Identificazione dei Rischi')
    pdf.body_text('Previsione dei potenziali problemi o imprevisti e sviluppo di strategie di mitigazione o piani di risposta.')

    pdf.section_title('16.2 Rischi Operativi')
    pdf.bullet_point('Ritardo consegna da parte dei fornitori per assenza della materia prima alternativa difficile da reperire')
    pdf.bullet_point('Difficolta nel reperire personale di laboratorio specializzato nella produzione di prodotti alternativi inclusivi e salutistici')

    pdf.section_title('16.3 Rischi di Mercato')
    pdf.bullet_point('Costo elevato delle materie prime alternative e difficolta nella loro reperibilita')
    pdf.bullet_point('Ancora molto scetticismo sulla bonta dei prodotti alternativi')
    pdf.bullet_point('Associazione prodotti alternativi come prodotti per malati')

    pdf.section_title('16.4 Strategie di Mitigazione')
    pdf.bullet_point('Individuazione di piu fornitori per l\'acquisto di una stessa materia prima')
    pdf.bullet_point('Se un fornitore chiave ritarda la consegna per mancata disponibilita, si contatta un altro fornitore per non rimanere senza stock')
    pdf.bullet_point('Diversificare i fornitori')
    pdf.bullet_point('Creare partnership stabili')
    pdf.bullet_point('Acquistare in volumi programmati')

    pdf.section_title('16.5 Monitoraggio dei Rischi')
    pdf.body_text('Si tiene sotto controllo l\'evolversi dei rischi identificati inizialmente e si cercano nuovi potenziali rischi che possono emergere durante l\'esecuzione.')

    # ============ CAPITOLO 17 ============
    pdf.add_page()
    pdf.chapter_title('CAPITOLO 17 - SOSTENIBILITA DEL PROGETTO')

    pdf.section_title('17.1 Sostenibilita Economica')
    pdf.bullet_point('Il budget stanziato e sufficiente per la realizzazione del laboratorio')
    pdf.bullet_point('Raggiungimento del break even point entro i 18 mesi di attivita')
    pdf.bullet_point('Capitale di sicurezza per copertura 3-6 mesi di costi operativi')

    pdf.section_title('17.2 Sostenibilita Ambientale')
    pdf.bullet_point('Packaging sostenibile')
    pdf.bullet_point('Utilizzo di tecniche di lavorazione innovative che mirano a preservare il valore nutrizionale delle materie prime')
    pdf.bullet_point('Attenzione alla sostenibilita ambientale in tutte le fasi del processo')

    pdf.section_title('17.3 Sostenibilita Etica e Sociale')
    pdf.bullet_point('Sostenibilita etica, economica e ambientale come valore fondante')
    pdf.bullet_point('Inclusivita come pilastro del progetto')
    pdf.bullet_point('Accessibilita della pasticceria a persone con esigenze alimentari specifiche')

    # ============ CAPITOLO 18 ============
    pdf.add_page()
    pdf.chapter_title('CAPITOLO 18 - MONITORAGGIO E VALUTAZIONE')

    pdf.section_title('18.1 Monitoraggio delle Attivita')
    pdf.body_text('Processo continuo e sistematico che si svolge parallelamente alla fase di esecuzione.')
    pdf.subsection_title('Monitoraggio delle tempistiche delle attivita pianificate:')
    pdf.bullet_point('Le attivita procedono secondo il cronoprogramma?')
    pdf.bullet_point('Ci sono ritardi?')
    pdf.bullet_point('Quali sono le attivita critiche che stanno eventualmente slittando?')
    pdf.subsection_title('Monitoraggio vendite:')
    pdf.bullet_point('Vengono confrontate le vendite online settimanali con gli obiettivi mensili')

    pdf.section_title('18.2 Monitoraggio dei Costi')
    pdf.bullet_point('Si tiene traccia delle spese effettive confrontandole con il budget preventivato')
    pdf.bullet_point('Si calcola il burn rate (tasso di spesa) per prevedere se il progetto finira over budget')

    pdf.section_title('18.3 Valutazione dell\'Efficacia')
    pdf.body_text('Vengono analizzati i risultati ottenuti durante il progetto in concomitanza con la fase di monitoraggio, al fine di trarre eventuali insegnamenti per il futuro.')
    pdf.bullet_point('Il progetto ha raggiunto gli obiettivi prefissati?')
    pdf.bullet_point('I deliverable sono stati completati rispettando i requisiti di qualita, tempo e budget?')
    pdf.bullet_point('I clienti sono soddisfatti dei risultati?')
    pdf.subsection_title('Test qualita:')
    pdf.body_text('Si eseguono verifiche e test per assicurarsi che i DELIVERABLE (prodotti intermedi o finali) soddisfino gli standard qualitativi e i requisiti concordati con il cliente')

    pdf.section_title('18.4 Valutazione dell\'Efficienza')
    pdf.bullet_point('Le risorse sono state utilizzate in modo ottimale?')
    pdf.bullet_point('I processi di lavoro sono stati efficienti?')

    # ============ CONCLUSIONI ============
    pdf.add_page()
    pdf.chapter_title('CONCLUSIONI')

    pdf.section_title('Considerazioni Finali sul Progetto')
    pdf.ln(10)
    pdf.set_font('Helvetica', 'B', 12)
    pdf.set_text_color(0, 51, 102)
    pdf.multi_cell(0, 8, 'SENZA NON SIGNIFICA PEGGIORE.')
    pdf.ln(3)
    pdf.multi_cell(0, 8, 'SENZA NON SIGNIFICA CHE HA QUALCOSA IN MENO.')
    pdf.ln(3)
    pdf.multi_cell(0, 8, 'SIGNIFICA SOLO CAMBIARE PROSPETTIVA E IMPARARE A GIOCARE CON GLI INGREDIENTI.')
    pdf.ln(10)

    pdf.section_title('Limiti del Progetto e Sviluppi Futuri')
    pdf.body_text('[Sezione da completare a cura dell\'autore]')

    # ============ PAGINA FINALE ============
    pdf.add_page()
    pdf.ln(80)
    pdf.set_font('Helvetica', 'B', 24)
    pdf.set_text_color(0, 51, 102)
    pdf.cell(0, 15, 'PAYOFF', 0, 1, 'C')
    pdf.ln(20)
    pdf.set_font('Helvetica', 'BI', 20)
    pdf.set_text_color(0, 102, 153)
    pdf.cell(0, 15, '"Dolci sani, belli, buoni... PER TUTTI"', 0, 1, 'C')

    # Salva il PDF
    output_path = '/home/user/Claude-code-Chatbot-Whatsapp-/Business_Plan_Pasticceria_Inclusiva.pdf'
    pdf.output(output_path)
    return output_path

if __name__ == '__main__':
    try:
        output_file = create_pdf()
        print(f'PDF generato con successo: {output_file}')
    except Exception as e:
        print(f'Errore nella generazione del PDF: {e}')
