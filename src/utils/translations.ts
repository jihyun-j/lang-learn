export type Locale = 'ko' | 'en';

export interface Translations {
  // Navigation
  nav: {
    home: string;
    learn: string;
    review: string;
    sentences: string;
    profile: string;
    logout: string;
  };
  
  // Common
  common: {
    loading: string;
    save: string;
    cancel: string;
    edit: string;
    delete: string;
    search: string;
    filter: string;
    difficulty: string;
    easy: string;
    medium: string;
    hard: string;
    date: string;
    language: string;
    email: string;
    password: string;
    nativeLanguage: string;
    targetLanguage: string;
    created: string;
    updated: string;
    total: string;
    accuracy: string;
    score: string;
    correct: string;
    incorrect: string;
    next: string;
    previous: string;
    close: string;
    apply: string;
    reset: string;
    clear: string;
  };

  // Auth
  auth: {
    signIn: string;
    signUp: string;
    signOut: string;
    createAccount: string;
    alreadyHaveAccount: string;
    noAccount: string;
    processing: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    appTitle: string;
    appSubtitle: string;
  };

  // Home
  home: {
    welcome: string;
    subtitle: string;
    currentLanguage: string;
    changeLanguageHint: string;
    todayActivity: string;
    todayActivitySubtitle: string;
    newSentences: string;
    newSentencesDesc: string;
    review: string;
    reviewDesc: string;
    goToLearn: string;
    goToReview: string;
    weeklyProgress: string;
    consecutiveDays: string;
    streak: string;
  };

  // Learn
  learn: {
    title: string;
    subtitle: string;
    tips: string;
    tipDaily: string;
    tipGrammar: string;
    tipDifficulty: string;
    tipReview: string;
    currentLanguage: string;
    languageHint: string;
    enterSentence: string;
    difficultySettings: string;
    translate: string;
    translating: string;
    translationResult: string;
    original: string;
    translation: string;
    saveSentence: string;
    saved: string;
    grammarCheck: string;
    grammarCheckTitle: string;
    grammarCheckDesc: string;
    manualCheck: string;
    errorDetection: string;
    instantFix: string;
    overallFix: string;
    languageSpecific: string;
    languageSpecificDesc: string;
    clickButton: string;
    audioError: string;
    playPronunciation: string;
    playing: string;
    grammarCheckError: string;
    grammarErrors: string;
    errorsFound: string;
    checkSuggestions: string;
    grammarErrorType: string;
    spellingErrorType: string;
    punctuationErrorType: string;
    styleErrorType: string;
    originalText: string;
    suggestion: string;
    explanation: string;
    overallCorrection: string;
    applyAll: string;
    confidence: string;
    noErrors: string;
    errorsDetected: string;
  };

  // Review
  review: {
    title: string;
    subtitle: string;
    selectType: string;
    byDate: string;
    byDateDesc: string;
    byDifficulty: string;
    byDifficultyDesc: string;
    mistakes: string;
    mistakesDesc: string;
    selectDate: string;
    selectDifficulty: string;
    currentSelection: string;
    sentencesReady: string;
    noSentences: string;
    noSentencesHint: string;
    speakSentence: string;
    recording: string;
    recordingHint: string;
    stopRecording: string;
    startRecording: string;
    analyzing: string;
    analyze: string;
    recognized: string;
    correct: string;
    incorrect: string;
    similarity: string;
    answer: string;
    nextSentence: string;
    tips: string;
    tipDate: string;
    tipDifficulty: string;
    tipMistakes: string;
    tipPronunciation: string;
    audioPlaying: string;
    audioPlayingHint: string;
  };

  // Quiz
  quiz: {
    title: string;
    subtitle: string;
    quizLanguage: string;
    quizLanguageDesc: string;
    noSentences: string;
    noSentencesHint: string;
    quizInfo: string;
    problems: string;
    language: string;
    rules: string;
    rule1: string;
    rule2: string;
    rule3: string;
    rule4: string;
    startQuiz: string;
    completed: string;
    completedSubtitle: string;
    grade: string;
    excellent: string;
    great: string;
    good: string;
    nice: string;
    practice: string;
    correctRate: string;
    averageSimilarity: string;
    tryAgain: string;
    backToList: string;
    inProgress: string;
    inProgressSubtitle: string;
    problem: string;
    correctAnswers: string;
    speakInLanguage: string;
    listenPronunciation: string;
    showResult: string;
    tips: string;
    tipListen: string;
    tipClear: string;
    tipAI: string;
    tipFinal: string;
  };

  // Sentences
  sentences: {
    title: string;
    totalSentences: string;
    quiz: string;
    sentence: string;
    translation: string;
    difficulty: string;
    registeredDate: string;
    actions: string;
    noSentences: string;
    noSentencesHint: string;
    noDateRange: string;
    noDateRangeHint: string;
    dateRange: string;
    startDate: string;
    endDate: string;
    after: string;
    before: string;
    selectDateRange: string;
    activeFilters: string;
    search: string;
    clearAllFilters: string;
    allDifficulties: string;
    editMode: string;
    editModeDesc: string;
    translating: string;
    editError: string;
    audioError: string;
    playingAudio: string;
    playingAudioHint: string;
    deleteConfirm: string;
    deleteFailed: string;
    saveFailed: string;
    cannotPlayWhileEditing: string;
    aiTranslationPending: string;
    aiTranslationDesc: string;
    results: string;
    tips: string;
    tipAudio: string;
    tipEdit: string;
    tipSearch: string;
    tipDifficulty: string;
    tipDateRange: string;
    tipQuiz: string;
    inlineEdit: string;
    inlineEditDesc: string;
    editingDisabled: string;
  };

  // Profile
  profile: {
    title: string;
    subtitle: string;
    currentLanguage: string;
    currentLanguageDesc: string;
    personalInfo: string;
    edit: string;
    save: string;
    cancel: string;
    email: string;
    joinDate: string;
    nativeLanguage: string;
    targetLanguages: string;
    maxLanguages: string;
    addLanguage: string;
    selectLanguage: string;
    learningStats: string;
    learningStatsDesc: string;
    totalSentences: string;
    totalReviews: string;
    averageAccuracy: string;
    consecutiveDays: string;
    thisWeek: string;
    lastWeek: string;
    streak: string;
    totalStudyTime: string;
    thisWeekActivity: string;
    learningLevel: string;
    beginner: string;
    intermediate: string;
    advanced: string;
    weeklyActivity: string;
    accuracyDistribution: string;
    monthlyProgress: string;
    difficultyDistribution: string;
    weeklyAccuracy: string;
    recentActivity: string;
    newSentence: string;
    review: string;
    pronunciationPractice: string;
    points: string;
    hours: string;
    minutes: string;
    profileUpdateSuccess: string;
    profileUpdateFailed: string;
    selectAtLeastOne: string;
  };

  // Errors
  errors: {
    networkError: string;
    apiError: string;
    translationFailed: string;
    grammarCheckFailed: string;
    audioFailed: string;
    saveFailed: string;
    loadFailed: string;
    deleteFailed: string;
    quotaExceeded: string;
    unknownError: string;
  };
}

export const translations: Record<Locale, Translations> = {
  ko: {
    nav: {
      home: 'Home',
      learn: 'Today\'s Learning',
      review: 'Today\'s Review',
      sentences: 'Sentence List',
      profile: 'Profile',
      logout: 'Logout',
    },
    common: {
      loading: 'Loading...',
      save: 'Save',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      search: 'Search',
      filter: 'Filter',
      difficulty: 'Difficulty',
      easy: 'Easy',
      medium: 'Medium',
      hard: 'Hard',
      date: 'Date',
      language: 'Language',
      email: 'Email',
      password: 'Password',
      nativeLanguage: 'Native Language',
      targetLanguage: 'Target Language',
      created: 'Created',
      updated: 'Updated',
      total: 'Total',
      accuracy: 'Accuracy',
      score: 'Score',
      correct: 'Correct',
      incorrect: 'Incorrect',
      next: 'Next',
      previous: 'Previous',
      close: 'Close',
      apply: 'Apply',
      reset: 'Reset',
      clear: 'Clear',
    },
    auth: {
      signIn: 'Sign In',
      signUp: 'Sign Up',
      signOut: 'Sign Out',
      createAccount: 'Create Account',
      alreadyHaveAccount: 'Already have an account? Sign In',
      noAccount: 'Don\'t have an account? Sign Up',
      processing: 'Processing...',
      emailPlaceholder: 'your@email.com',
      passwordPlaceholder: '••••••••',
      appTitle: 'LangLearn',
      appSubtitle: 'Smart Language Learning with AI',
    },
    home: {
      welcome: 'Hello! 👋',
      subtitle: 'Learn languages smartly with AI',
      currentLanguage: 'Current Learning Language:',
      changeLanguageHint: 'You can change to other languages in the sidebar',
      todayActivity: 'Today\'s Learning Activity',
      todayActivitySubtitle: 'Check your learning activities for today',
      newSentences: 'New Sentence Learning',
      newSentencesDesc: 'Sentences added today',
      review: 'Review',
      reviewDesc: 'Sentences reviewed today',
      goToLearn: 'Go to Learning',
      goToReview: 'Go to Review',
      weeklyProgress: 'This Week\'s Progress',
      consecutiveDays: 'consecutive days of learning!',
      streak: 'days',
    },
    learn: {
      title: 'Today\'s Learning',
      subtitle: 'Enter new sentences and let AI interpret them for you',
      tips: 'Learning Tips',
      tipDaily: 'Try entering sentences you use frequently in daily life',
      tipGrammar: 'Grammar errors will be corrected before saving',
      tipDifficulty: 'Set appropriate difficulty levels for systematic learning',
      tipReview: 'Saved sentences can be practiced in review mode',
      currentLanguage: 'Current Learning Language:',
      languageHint: 'You can change to other languages in the sidebar',
      enterSentence: 'Please enter a sentence',
      difficultySettings: 'Difficulty Settings',
      translate: 'AI Translate',
      translating: 'Translating...',
      translationResult: 'Translation Result',
      original: 'Original',
      translation: 'Korean Translation',
      saveSentence: 'Save Sentence',
      saved: 'Saved!',
      grammarCheck: 'Grammar Check',
      grammarCheckTitle: 'AI Grammar Check Feature',
      grammarCheckDesc: 'Manual Check: Click the grammar check button in the input field when needed',
      manualCheck: 'Manual Check',
      errorDetection: 'Various Error Detection: Checks grammar, spelling, punctuation, and style errors',
      instantFix: 'Instant Fix: Apply suggested corrections with one click',
      overallFix: 'Overall Fix: Option to fix all errors at once',
      languageSpecific: 'Specialized Grammar Check',
      languageSpecificDesc: 'provides specialized grammar checking! Get accurate error detection and natural expression suggestions considering language-specific characteristics.',
      clickButton: 'You can check grammar anytime by clicking the button.',
      audioError: 'Audio Playback Error:',
      playPronunciation: 'Listen to Pronunciation',
      playing: 'Playing...',
      grammarCheckError: 'Grammar Check Error:',
      grammarErrors: 'Grammar Check Complete',
      errorsFound: 'Grammar Errors Found',
      checkSuggestions: 'Please check the suggestions below.',
      grammarErrorType: 'Grammar',
      spellingErrorType: 'Spelling',
      punctuationErrorType: 'Punctuation',
      styleErrorType: 'Style',
      originalText: 'Original:',
      suggestion: 'Suggestion:',
      explanation: 'Explanation',
      overallCorrection: 'Overall Correction Suggestion:',
      applyAll: 'Apply All',
      confidence: 'Confidence:',
      noErrors: 'No Errors',
      errorsDetected: 'errors detected.',
    },
    review: {
      title: 'Today\'s Review',
      subtitle: 'Select review type and practice pronunciation with voice',
      selectType: 'Select Review Type',
      byDate: 'Review by Date',
      byDateDesc: 'Sentences learned on specific dates',
      byDifficulty: 'Review by Difficulty',
      byDifficultyDesc: 'Sentences of desired difficulty',
      mistakes: 'Frequently Missed Sentences',
      mistakesDesc: 'Practice sentences with low accuracy again',
      selectDate: 'Select Date to Review',
      selectDifficulty: 'Select Difficulty',
      currentSelection: 'sentences ready',
      sentencesReady: 'sentences ready',
      noSentences: 'No sentences match the selected criteria.',
      noSentencesHint: 'Try selecting a different review type or add sentences in \'Today\'s Learning\'.',
      speakSentence: 'Please speak the following sentence',
      recording: 'Recording... Press the button again to stop',
      recordingHint: 'Press the microphone button to start recording',
      stopRecording: 'Stop Recording',
      startRecording: 'Start Recording',
      analyzing: 'Analyzing...',
      analyze: 'AI Analysis',
      recognized: 'Recognized Speech',
      correct: 'Correct! 🎉',
      incorrect: 'Close! 😊',
      similarity: 'Similarity:',
      answer: 'Answer',
      nextSentence: 'Next Sentence',
      tips: 'Review Tips',
      tipDate: 'Review by Date: Systematically review sentences learned on specific dates',
      tipDifficulty: 'Review by Difficulty: Step-by-step learning with sentences of desired difficulty',
      tipMistakes: 'Frequently Missed Sentences: Intensively improve weak points',
      tipPronunciation: 'Listen to Pronunciation: Learn accurate pronunciation by listening to native speakers',
      audioPlaying: 'Playing pronunciation...',
      audioPlayingHint: 'Click the pronunciation button again to stop.',
    },
    quiz: {
      title: 'Quiz Mode',
      subtitle: 'Test your skills with randomly selected sentences',
      quizLanguage: 'Quiz Language:',
      quizLanguageDesc: 'will be randomly selected from sentences learned in',
      noSentences: 'No sentences available for quiz in',
      noSentencesHint: 'Please add sentences in \'Today\'s Learning\' first.',
      quizInfo: 'Quiz Information',
      problems: 'Number of Problems:',
      language: 'Language:',
      rules: 'Quiz Rules',
      rule1: 'Look at Korean sentences and pronounce them',
      rule2: 'AI analyzes pronunciation accuracy in real-time',
      rule3: 'Final score will be displayed after completing all problems',
      rule4: 'You can listen to the correct pronunciation with the listen button',
      startQuiz: 'Start Quiz',
      completed: 'Quiz Completed!',
      completedSubtitle: 'Great job! Check your results',
      grade: 'Grade',
      excellent: 'Perfect! 🏆',
      great: 'Excellent! 🎉',
      good: 'Well done! 👏',
      nice: 'Good! 💪',
      practice: 'Keep practicing! 📚',
      correctRate: 'Correct Rate',
      averageSimilarity: 'Average Similarity',
      tryAgain: 'Try Again',
      backToList: 'Back to Sentence List',
      inProgress: 'Quiz in Progress',
      inProgressSubtitle: 'Practice pronunciation with voice and AI will determine accuracy',
      problem: 'Problem',
      correctAnswers: 'Correct:',
      speakInLanguage: 'in',
      listenPronunciation: 'Listen to Pronunciation',
      showResult: 'Show Results',
      tips: 'Quiz Tips',
      tipListen: 'Listen to native pronunciation with the pronunciation button',
      tipClear: 'Clear and slow pronunciation is important',
      tipAI: 'AI recognizes speech and determines accuracy',
      tipFinal: 'Final score will be displayed after completing all problems',
    },
    sentences: {
      title: 'Sentence List',
      totalSentences: 'You are learning a total of sentences in',
      quiz: 'Quiz',
      sentence: 'Sentence',
      translation: 'Translation',
      difficulty: 'Difficulty',
      registeredDate: 'Registered Date',
      actions: 'Actions',
      noSentences: 'No sentences registered in',
      noSentencesHint: 'Please add sentences in \'Today\'s Learning\' first.',
      noDateRange: 'No sentences found in the selected date range.',
      noDateRangeHint: 'Try selecting a different date range or reset filters.',
      dateRange: 'Select Date Range',
      startDate: 'Start Date',
      endDate: 'End Date',
      after: 'after',
      before: 'before',
      selectDateRange: 'Please select a date range',
      activeFilters: 'Active Filters:',
      search: 'Search:',
      clearAllFilters: 'Clear All Filters',
      allDifficulties: 'All Difficulties',
      editMode: 'Edit Mode:',
      editModeDesc: 'When you modify and save a sentence, AI will automatically retranslate it.',
      translating: 'Translating...',
      editError: 'Edit Error:',
      audioError: 'Audio Playback Error:',
      playingAudio: 'Playing pronunciation...',
      playingAudioHint: 'Click the same button again to stop, or play another sentence.',
      deleteConfirm: 'Are you sure you want to delete this sentence?',
      deleteFailed: 'Failed to delete sentence.',
      saveFailed: 'Failed to save. Please try again.',
      cannotPlayWhileEditing: 'Cannot play while editing',
      aiTranslationPending: 'AI Translation Pending',
      aiTranslationDesc: 'Will be automatically translated when saved',
      results: 'results',
      tips: 'Sentence List Tips',
      tipAudio: 'Click the pronunciation button to listen to native pronunciation',
      tipEdit: 'Use the edit button to modify sentences and AI will automatically retranslate',
      tipSearch: 'Use the search function to quickly find specific sentences',
      tipDifficulty: 'Use difficulty filters to systematically manage learning stages',
      tipDateRange: 'Use date range filters to check sentences learned in specific periods',
      tipQuiz: 'Test random sentences with quiz mode',
      inlineEdit: 'Inline Edit Feature',
      inlineEditDesc: 'You can edit sentences directly! Click the edit button to modify sentences and difficulty, and AI will automatically retranslate to Korean.',
      editingDisabled: 'Audio playback is disabled while editing.',
    },
    profile: {
      title: 'Profile',
      subtitle: 'Check your personal information and learning statistics',
      currentLanguage: 'Currently Selected Language:',
      currentLanguageDesc: 'The statistics below are based on learning data',
      personalInfo: 'Personal Information',
      edit: 'Edit',
      save: 'Save',
      cancel: 'Cancel',
      email: 'Email',
      joinDate: 'Join Date',
      nativeLanguage: 'Native Language',
      targetLanguages: 'Target Languages',
      maxLanguages: '(Max 3)',
      addLanguage: 'Add Language',
      selectLanguage: 'Select Language',
      learningStats: 'Learning Statistics',
      learningStatsDesc: 'Check your learning progress and achievements at a glance',
      totalSentences: 'Total Learning Sentences',
      totalReviews: 'Total Reviews',
      averageAccuracy: 'Average Accuracy',
      consecutiveDays: 'Consecutive Learning Days',
      thisWeek: 'this week',
      lastWeek: 'compared to last week',
      streak: 'streak record',
      totalStudyTime: 'Total Study Time',
      thisWeekActivity: 'This Week\'s Activity',
      learningLevel: 'Learning Level',
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
      weeklyActivity: 'Weekly Learning Activity',
      accuracyDistribution: 'Accuracy Distribution',
      monthlyProgress: 'Monthly Learning Progress',
      difficultyDistribution: 'Difficulty Distribution',
      weeklyAccuracy: 'Weekly Accuracy Trend',
      recentActivity: 'Recent Activity',
      newSentence: 'New Sentence',
      review: 'Review',
      pronunciationPractice: 'Pronunciation Practice',
      points: 'points',
      hours: 'hours',
      minutes: 'minutes',
      profileUpdateSuccess: 'Profile updated successfully.',
      profileUpdateFailed: 'Failed to update profile.',
      selectAtLeastOne: 'Please select at least one target language.',
    },
    errors: {
      networkError: 'Please check your network connection.',
      apiError: 'An API error occurred.',
      translationFailed: 'Translation failed.',
      grammarCheckFailed: 'Grammar check failed.',
      audioFailed: 'Audio playback failed.',
      saveFailed: 'Save failed.',
      loadFailed: 'Failed to load data.',
      deleteFailed: 'Delete failed.',
      quotaExceeded: 'API usage quota exceeded.',
      unknownError: 'An unknown error occurred.',
    },
  },
  en: {
    nav: {
      home: 'Home',
      learn: 'Today\'s Learning',
      review: 'Today\'s Review',
      sentences: 'Sentence List',
      profile: 'Profile',
      logout: 'Logout',
    },
    common: {
      loading: 'Loading...',
      save: 'Save',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      search: 'Search',
      filter: 'Filter',
      difficulty: 'Difficulty',
      easy: 'Easy',
      medium: 'Medium',
      hard: 'Hard',
      date: 'Date',
      language: 'Language',
      email: 'Email',
      password: 'Password',
      nativeLanguage: 'Native Language',
      targetLanguage: 'Target Language',
      created: 'Created',
      updated: 'Updated',
      total: 'Total',
      accuracy: 'Accuracy',
      score: 'Score',
      correct: 'Correct',
      incorrect: 'Incorrect',
      next: 'Next',
      previous: 'Previous',
      close: 'Close',
      apply: 'Apply',
      reset: 'Reset',
      clear: 'Clear',
    },
    auth: {
      signIn: 'Sign In',
      signUp: 'Sign Up',
      signOut: 'Sign Out',
      createAccount: 'Create Account',
      alreadyHaveAccount: 'Already have an account? Sign In',
      noAccount: 'Don\'t have an account? Sign Up',
      processing: 'Processing...',
      emailPlaceholder: 'your@email.com',
      passwordPlaceholder: '••••••••',
      appTitle: 'LangLearn',
      appSubtitle: 'Smart Language Learning with AI',
    },
    home: {
      welcome: 'Hello! 👋',
      subtitle: 'Learn languages smartly with AI',
      currentLanguage: 'Current Learning Language:',
      changeLanguageHint: 'You can change to other languages in the sidebar',
      todayActivity: 'Today\'s Learning Activity',
      todayActivitySubtitle: 'Check your learning activities for today',
      newSentences: 'New Sentence Learning',
      newSentencesDesc: 'Sentences added today',
      review: 'Review',
      reviewDesc: 'Sentences reviewed today',
      goToLearn: 'Go to Learning',
      goToReview: 'Go to Review',
      weeklyProgress: 'This Week\'s Progress',
      consecutiveDays: 'consecutive days of learning!',
      streak: 'days',
    },
    learn: {
      title: 'Today\'s Learning',
      subtitle: 'Enter new sentences and let AI interpret them for you',
      tips: 'Learning Tips',
      tipDaily: 'Try entering sentences you use frequently in daily life',
      tipGrammar: 'Grammar errors will be corrected before saving',
      tipDifficulty: 'Set appropriate difficulty levels for systematic learning',
      tipReview: 'Saved sentences can be practiced in review mode',
      currentLanguage: 'Current Learning Language:',
      languageHint: 'You can change to other languages in the sidebar',
      enterSentence: 'Please enter a sentence',
      difficultySettings: 'Difficulty Settings',
      translate: 'AI Translate',
      translating: 'Translating...',
      translationResult: 'Translation Result',
      original: 'Original',
      translation: 'Korean Translation',
      saveSentence: 'Save Sentence',
      saved: 'Saved!',
      grammarCheck: 'Grammar Check',
      grammarCheckTitle: 'AI Grammar Check Feature',
      grammarCheckDesc: 'Manual Check: Click the grammar check button in the input field when needed',
      manualCheck: 'Manual Check',
      errorDetection: 'Various Error Detection: Checks grammar, spelling, punctuation, and style errors',
      instantFix: 'Instant Fix: Apply suggested corrections with one click',
      overallFix: 'Overall Fix: Option to fix all errors at once',
      languageSpecific: 'Specialized Grammar Check',
      languageSpecificDesc: 'provides specialized grammar checking! Get accurate error detection and natural expression suggestions considering language-specific characteristics.',
      clickButton: 'You can check grammar anytime by clicking the button.',
      audioError: 'Audio Playback Error:',
      playPronunciation: 'Listen to Pronunciation',
      playing: 'Playing...',
      grammarCheckError: 'Grammar Check Error:',
      grammarErrors: 'Grammar Check Complete',
      errorsFound: 'Grammar Errors Found',
      checkSuggestions: 'Please check the suggestions below.',
      grammarErrorType: 'Grammar',
      spellingErrorType: 'Spelling',
      punctuationErrorType: 'Punctuation',
      styleErrorType: 'Style',
      originalText: 'Original:',
      suggestion: 'Suggestion:',
      explanation: 'Explanation',
      overallCorrection: 'Overall Correction Suggestion:',
      applyAll: 'Apply All',
      confidence: 'Confidence:',
      noErrors: 'No Errors',
      errorsDetected: 'errors detected.',
    },
    review: {
      title: 'Today\'s Review',
      subtitle: 'Select review type and practice pronunciation with voice',
      selectType: 'Select Review Type',
      byDate: 'Review by Date',
      byDateDesc: 'Sentences learned on specific dates',
      byDifficulty: 'Review by Difficulty',
      byDifficultyDesc: 'Sentences of desired difficulty',
      mistakes: 'Frequently Missed Sentences',
      mistakesDesc: 'Practice sentences with low accuracy again',
      selectDate: 'Select Date to Review',
      selectDifficulty: 'Select Difficulty',
      currentSelection: 'sentences ready',
      sentencesReady: 'sentences ready',
      noSentences: 'No sentences match the selected criteria.',
      noSentencesHint: 'Try selecting a different review type or add sentences in \'Today\'s Learning\'.',
      speakSentence: 'Please speak the following sentence',
      recording: 'Recording... Press the button again to stop',
      recordingHint: 'Press the microphone button to start recording',
      stopRecording: 'Stop Recording',
      startRecording: 'Start Recording',
      analyzing: 'Analyzing...',
      analyze: 'AI Analysis',
      recognized: 'Recognized Speech',
      correct: 'Correct! 🎉',
      incorrect: 'Close! 😊',
      similarity: 'Similarity:',
      answer: 'Answer',
      nextSentence: 'Next Sentence',
      tips: 'Review Tips',
      tipDate: 'Review by Date: Systematically review sentences learned on specific dates',
      tipDifficulty: 'Review by Difficulty: Step-by-step learning with sentences of desired difficulty',
      tipMistakes: 'Frequently Missed Sentences: Intensively improve weak points',
      tipPronunciation: 'Listen to Pronunciation: Learn accurate pronunciation by listening to native speakers',
      audioPlaying: 'Playing pronunciation...',
      audioPlayingHint: 'Click the pronunciation button again to stop.',
    },
    quiz: {
      title: 'Quiz Mode',
      subtitle: 'Test your skills with randomly selected sentences',
      quizLanguage: 'Quiz Language:',
      quizLanguageDesc: 'will be randomly selected from sentences learned in',
      noSentences: 'No sentences available for quiz in',
      noSentencesHint: 'Please add sentences in \'Today\'s Learning\' first.',
      quizInfo: 'Quiz Information',
      problems: 'Number of Problems:',
      language: 'Language:',
      rules: 'Quiz Rules',
      rule1: 'Look at Korean sentences and pronounce them',
      rule2: 'AI analyzes pronunciation accuracy in real-time',
      rule3: 'Final score will be displayed after completing all problems',
      rule4: 'You can listen to the correct pronunciation with the listen button',
      startQuiz: 'Start Quiz',
      completed: 'Quiz Completed!',
      completedSubtitle: 'Great job! Check your results',
      grade: 'Grade',
      excellent: 'Perfect! 🏆',
      great: 'Excellent! 🎉',
      good: 'Well done! 👏',
      nice: 'Good! 💪',
      practice: 'Keep practicing! 📚',
      correctRate: 'Correct Rate',
      averageSimilarity: 'Average Similarity',
      tryAgain: 'Try Again',
      backToList: 'Back to Sentence List',
      inProgress: 'Quiz in Progress',
      inProgressSubtitle: 'Practice pronunciation with voice and AI will determine accuracy',
      problem: 'Problem',
      correctAnswers: 'Correct:',
      speakInLanguage: 'in',
      listenPronunciation: 'Listen to Pronunciation',
      showResult: 'Show Results',
      tips: 'Quiz Tips',
      tipListen: 'Listen to native pronunciation with the pronunciation button',
      tipClear: 'Clear and slow pronunciation is important',
      tipAI: 'AI recognizes speech and determines accuracy',
      tipFinal: 'Final score will be displayed after completing all problems',
    },
    sentences: {
      title: 'Sentence List',
      totalSentences: 'You are learning a total of sentences in',
      quiz: 'Quiz',
      sentence: 'Sentence',
      translation: 'Translation',
      difficulty: 'Difficulty',
      registeredDate: 'Registered Date',
      actions: 'Actions',
      noSentences: 'No sentences registered in',
      noSentencesHint: 'Please add sentences in \'Today\'s Learning\' first.',
      noDateRange: 'No sentences found in the selected date range.',
      noDateRangeHint: 'Try selecting a different date range or reset filters.',
      dateRange: 'Select Date Range',
      startDate: 'Start Date',
      endDate: 'End Date',
      after: 'after',
      before: 'before',
      selectDateRange: 'Please select a date range',
      activeFilters: 'Active Filters:',
      search: 'Search:',
      clearAllFilters: 'Clear All Filters',
      allDifficulties: 'All Difficulties',
      editMode: 'Edit Mode:',
      editModeDesc: 'When you modify and save a sentence, AI will automatically retranslate it.',
      translating: 'Translating...',
      editError: 'Edit Error:',
      audioError: 'Audio Playback Error:',
      playingAudio: 'Playing pronunciation...',
      playingAudioHint: 'Click the same button again to stop, or play another sentence.',
      deleteConfirm: 'Are you sure you want to delete this sentence?',
      deleteFailed: 'Failed to delete sentence.',
      saveFailed: 'Failed to save. Please try again.',
      cannotPlayWhileEditing: 'Cannot play while editing',
      aiTranslationPending: 'AI Translation Pending',
      aiTranslationDesc: 'Will be automatically translated when saved',
      results: 'results',
      tips: 'Sentence List Tips',
      tipAudio: 'Click the pronunciation button to listen to native pronunciation',
      tipEdit: 'Use the edit button to modify sentences and AI will automatically retranslate',
      tipSearch: 'Use the search function to quickly find specific sentences',
      tipDifficulty: 'Use difficulty filters to systematically manage learning stages',
      tipDateRange: 'Use date range filters to check sentences learned in specific periods',
      tipQuiz: 'Test random sentences with quiz mode',
      inlineEdit: 'Inline Edit Feature',
      inlineEditDesc: 'You can edit sentences directly! Click the edit button to modify sentences and difficulty, and AI will automatically retranslate to Korean.',
      editingDisabled: 'Audio playback is disabled while editing.',
    },
    profile: {
      title: 'Profile',
      subtitle: 'Check your personal information and learning statistics',
      currentLanguage: 'Currently Selected Language:',
      currentLanguageDesc: 'The statistics below are based on learning data',
      personalInfo: 'Personal Information',
      edit: 'Edit',
      save: 'Save',
      cancel: 'Cancel',
      email: 'Email',
      joinDate: 'Join Date',
      nativeLanguage: 'Native Language',
      targetLanguages: 'Target Languages',
      maxLanguages: '(Max 3)',
      addLanguage: 'Add Language',
      selectLanguage: 'Select Language',
      learningStats: 'Learning Statistics',
      learningStatsDesc: 'Check your learning progress and achievements at a glance',
      totalSentences: 'Total Learning Sentences',
      totalReviews: 'Total Reviews',
      averageAccuracy: 'Average Accuracy',
      consecutiveDays: 'Consecutive Learning Days',
      thisWeek: 'this week',
      lastWeek: 'compared to last week',
      streak: 'streak record',
      totalStudyTime: 'Total Study Time',
      thisWeekActivity: 'This Week\'s Activity',
      learningLevel: 'Learning Level',
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
      weeklyActivity: 'Weekly Learning Activity',
      accuracyDistribution: 'Accuracy Distribution',
      monthlyProgress: 'Monthly Learning Progress',
      difficultyDistribution: 'Difficulty Distribution',
      weeklyAccuracy: 'Weekly Accuracy Trend',
      recentActivity: 'Recent Activity',
      newSentence: 'New Sentence',
      review: 'Review',
      pronunciationPractice: 'Pronunciation Practice',
      points: 'points',
      hours: 'hours',
      minutes: 'minutes',
      profileUpdateSuccess: 'Profile updated successfully.',
      profileUpdateFailed: 'Failed to update profile.',
      selectAtLeastOne: 'Please select at least one target language.',
    },
    errors: {
      networkError: 'Please check your network connection.',
      apiError: 'An API error occurred.',
      translationFailed: 'Translation failed.',
      grammarCheckFailed: 'Grammar check failed.',
      audioFailed: 'Audio playback failed.',
      saveFailed: 'Save failed.',
      loadFailed: 'Failed to load data.',
      deleteFailed: 'Delete failed.',
      quotaExceeded: 'API usage quota exceeded.',
      unknownError: 'An unknown error occurred.',
    },
  },
};

export function getTranslation(locale: Locale): Translations {
  return translations['en']; // Always return English translations
}

export function t(locale: Locale, key: string): string {
  const keys = key.split('.');
  let value: any = translations['en']; // Always use English translations
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return value || key;
}