

export type Language = 'English' | 'Russian' | 'Slovak';

export const translations = {
  English: {
    title: "VD super OCR PDF & Images",
    poweredBy: "Powered by Gemini 2.5 Flash",
    heroTitle: "Extract text from Docs & Images",
    heroSubtitle: "instantly with AI",
    heroDesc: "Upload your scanned PDFs, screenshots, or images (up to 10 files), use your microphone, or paste YouTube links.",
    
    // Tabs
    tabFiles: "Files & Camera",
    tabMic: "Microphone",
    tabYoutube: "YouTube",
    tabText: "Text Input", // New translation

    // File Uploader
    clickToUpload: "Click to upload or drag and drop",
    supportedFormats: "PDF, Images, DOCX, or TXT",
    maxFiles: "Max 10 files",
    takePhoto: "Take Photo",
    aiAnalysis: "AI-Powered Text & Table Analysis",
    smartDescription: "Smart Image Description",
    smartDescriptionDesc: "Get a detailed AI description of the image content instead of just raw text.",

    // Mic
    micTitle: "Audio Input",
    micDesc: "Record your voice to generate text for transcription, translation, or podcast creation.",
    startRecord: "Start Recording",
    stopRecord: "Stop Recording",
    requestMic: "Requesting Mic...",
    transcribe: "Transcribe Audio",
    clearMic: "Clear Audio Input",
    recordedAudio: "Recorded Audio",

    // YouTube
    ytTitle: "YouTube Transcription",
    ytDesc: "Paste a YouTube link OR enter a Video Title to extract the content.",
    ytPlaceholder: "Paste link or enter video title...",
    ytButton: "Find & Extract Text",
    ytProcessing: "Searching & Processing...",

    // YouTube Modal specific
    ytModalTitle: "YouTube Video URL",
    ytModalInstructions: "To use a YouTube video as a source, paste its URL below.",
    ytModalInputPlaceholder: "Paste YouTube video URL*",
    ytModalNotes: "Notes",
    ytNote1: "Only the transcript will be imported.",
    ytNote2: "Only public YouTube videos are supported.",
    ytNote3: "Recently uploaded videos may not be available for import.",
    ytNoteMoreInfo: "More on common reasons for upload failures...",

    // Text Input specific
    textInputTitle: "Plain Text Input", // New translation
    textInputDesc: "Paste or type any text to process it. You can then translate it or generate a podcast script.", // New translation
    textInputPlaceholder: "Enter or paste your text here...", // New translation
    processText: "Process Text", // New translation
    clearText: "Clear Text Input", // New translation

    // Actions
    filesLoaded: "Files Loaded",
    audioTranscribed: "Audio Transcribed",
    videoProcessed: "Video Processed",
    changeInput: "Change Input",
    extractText: "Extract Text",
    analyzeImage: "Analyze Image",
    extractAgain: "Extract Again",
    analyzeAgain: "Analyze Again",
    transcribed: "Transcribed",

    // Results
    uploadedFiles: "Uploaded Files",
    addPhoto: "Add Photo",
    readyToExtract: "Ready to Extract",
    readyToExtractDesc: "Upload a document, take a photo, or paste a link to begin.",
    sourceText: "Source Text",
    imageDesc: "Image Description",
    podcastScript: "Podcast Script",
    translated: "Translated",
    extractedContent: "Extracted Content",
    generatePodcast: "Generate Podcast",
    playing: "Audio",
    settings: "Settings",
    original: "Original",
    translate: "Translate",
    download: "Download",
    copy: "Copy",
    wordCount: "Word Count", // New translation
    
    // Voice Settings
    voiceSettings: "Podcast Voice Settings",
    voice: "Voice",
  },
  Russian: {
    title: "VD супер OCR PDF и Фото",
    poweredBy: "На базе Gemini 2.5 Flash",
    heroTitle: "Извлекайте текст из документов",
    heroSubtitle: "мгновенно с помощью ИИ",
    heroDesc: "Загружайте сканы PDF, скриншоты или фото (до 10 файлов), используйте микрофон или ссылки YouTube.",

    tabFiles: "Файлы и Камера",
    tabMic: "Микрофон",
    tabYoutube: "YouTube",
    tabText: "Ввод текста", // New translation

    clickToUpload: "Нажмите для загрузки или перетащите файлы",
    supportedFormats: "PDF, Фото, DOCX или TXT",
    maxFiles: "Макс. 10 файлов",
    takePhoto: "Сделать фото",
    aiAnalysis: "ИИ-анализ текста и таблиц",
    smartDescription: "Умное описание фото",
    smartDescriptionDesc: "Получите детальное описание того, что изображено на фото, вместо простого текста.",

    micTitle: "Аудиоввод",
    micDesc: "Запишите голос для транскрипции, перевода или создания подкаста.",
    startRecord: "Начать запись",
    stopRecord: "Остановить запись",
    requestMic: "Запрос микрофона...",
    transcribe: "Транскрибировать",
    clearMic: "Очистить",
    recordedAudio: "Записанное аудио",

    ytTitle: "Транскрипция YouTube",
    ytDesc: "Вставьте ссылку или название видео YouTube для получения полного текста.",
    ytPlaceholder: "Ссылка или название видео...",
    ytButton: "Найти и извлечь",
    ytProcessing: "Поиск и обработка...",

    // YouTube Modal specific
    ytModalTitle: "URL видео на YouTube",
    ytModalInstructions: "Чтобы использовать видео на YouTube как источник, вставьте его URL ниже.",
    ytModalInputPlaceholder: "Вставьте URL видео на YouTube*",
    ytModalNotes: "Примечания",
    ytNote1: "Сейчас будет импортирована только расшифровка.",
    ytNote2: "Поддерживаются только общедоступные видео на YouTube.",
    ytNote3: "Недавно загруженные видео могут быть недоступны для импорта.",
    ytNoteMoreInfo: "Подробнее о частых причинах сбоев при загрузке...",

    // Text Input specific
    textInputTitle: "Ввод обычного текста", // New translation
    textInputDesc: "Вставьте или введите любой текст для обработки. Вы сможете перевести его или сгенерировать сценарий подкаста.", // New translation
    textInputPlaceholder: "Введите или вставьте текст сюда...", // New translation
    processText: "Обработать текст", // New translation
    clearText: "Очистить текстовый ввод", // New translation

    filesLoaded: "Файлы загружены",
    audioTranscribed: "Аудио обработано",
    videoProcessed: "Видео обработано",
    changeInput: "Изменить ввод",
    extractText: "Извлечь текст",
    analyzeImage: "Анализ фото",
    extractAgain: "Извлечь снова",
    analyzeAgain: "Анализ снова",
    transcribed: "Готово",

    uploadedFiles: "Загруженные файлы",
    addPhoto: "Добавить фото",
    readyToExtract: "Готов к работе",
    readyToExtractDesc: "Загрузите документ, сделайте фото или вставьте ссылку.",
    sourceText: "Исходный текст",
    imageDesc: "Описание фото",
    podcastScript: "Сценарий подкаста",
    translated: "Перевод",
    extractedContent: "Результат",
    generatePodcast: "Создать подкаст",
    playing: "Аудио",
    settings: "Настройки",
    original: "Оригинал",
    translate: "Перевести",
    download: "Скачать",
    copy: "Копировать",
    wordCount: "Количество слов", // New translation

    voiceSettings: "Настройки голоса подкаста",
    voice: "Голос",
  },
  Slovak: {
    title: "VD super OCR PDF a Obrázky",
    poweredBy: "Poháňané Gemini 2.5 Flash",
    heroTitle: "Extrahujte text z dokumentov",
    heroSubtitle: "okamžite pomocou AI",
    heroDesc: "Nahrajte naskenované PDF, snímky obrazovky alebo obrázky (až 10 súborov), použite mikrofón alebo odkazy na YouTube.",

    tabFiles: "Súbory a Kamera",
    tabMic: "Mikrofón",
    tabYoutube: "YouTube",
    tabText: "Textový vstup", // New translation

    clickToUpload: "Kliknite pre nahranie alebo presuňte súbory",
    supportedFormats: "PDF, Obrázky, DOCX alebo TXT",
    maxFiles: "Max 10 súborov",
    takePhoto: "Odfotiť",
    aiAnalysis: "AI analýza textu a tabuliek",
    smartDescription: "Inteligentný popis fotky",
    smartDescriptionDesc: "Získajte podrobný popis obsahu fotografie namiesto len surového textu.",

    micTitle: "Audio vstup",
    micDesc: "Nahrajte svoj hlas na prepis, preklad alebo vytvorenie podcastu.",
    startRecord: "Spustiť nahrávanie",
    stopRecord: "Zastaviť nahrávanie",
    requestMic: "Žiadosť o mikrofón...",
    transcribe: "Prepísať audio",
    clearMic: "Vymazať",
    recordedAudio: "Nahrané audio",

    ytTitle: "YouTube Prepis",
    ytDesc: "Vložte odkaz alebo názov videa YouTube pre získanie celého textu.",
    ytPlaceholder: "Odkaz alebo názov videa...",
    ytButton: "Nájsť a získať text",
    ytProcessing: "Vyhľadávanie a spracovanie...",

    // YouTube Modal specific
    ytModalTitle: "URL videa na YouTube",
    ytModalInstructions: "Pre použitie videa YouTube ako zdroja vložte jeho URL nižšie.",
    ytModalInputPlaceholder: "Vložte URL videa na YouTube*",
    ytModalNotes: "Poznámky",
    ytNote1: "Teraz bude importovaný iba prepis.",
    ytNote2: "Podporované sú iba verejné videá na YouTube.",
    ytNote3: "Nedávno nahrané videá nemusia byť dostupné na import.",
    ytNoteMoreInfo: "Viac o častých dôvodoch zlyhania nahrávania...",

    // Text Input specific
    textInputTitle: "Vstup obyčajného textu", // New translation
    textInputDesc: "Vložte alebo zadajte ľubovoľný text na spracovanie. Môžete ho preložiť alebo vygenerovať scenár podcastu.", // New translation
    textInputPlaceholder: "Zadajte alebo vložte svoj text sem...", // New translation
    processText: "Spracovať text", // New translation
    clearText: "Vymazať textový vstup", // New translation

    filesLoaded: "Súbory načítané",
    audioTranscribed: "Audio prepísané",
    videoProcessed: "Video spracované",
    changeInput: "Zmeniť vstup",
    extractText: "Extrahovať text",
    analyzeImage: "Analyzovať fotku",
    extractAgain: "Extrahovať znova",
    analyzeAgain: "Analyzovať znova",
    transcribed: "Hotovo",

    uploadedFiles: "Nahrané súbory",
    addPhoto: "Pridať fotku",
    readyToExtract: "Pripravené",
    readyToExtractDesc: "Nahrajte dokument, odfoťte alebo vložte odkaz.",
    sourceText: "Zdrojový text",
    imageDesc: "Popis obrázka",
    podcastScript: "Skript podcastu",
    translated: "Preklad",
    extractedContent: "Extrahovaný obsah",
    generatePodcast: "Vytvoriť podcast",
    playing: "Audio",
    settings: "Nastavenia",
    original: "Originál",
    translate: "Preložiť",
    download: "Stiahnuť",
    copy: "Kopírovať",
    wordCount: "Počet slov", // New translation

    voiceSettings: "Nastavenia hlasu podcastu",
    voice: "Hlas",
  }
};