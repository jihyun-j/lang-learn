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
      home: '홈',
      learn: '오늘의 학습',
      review: '오늘의 복습',
      sentences: '문장 리스트',
      profile: '프로필',
      logout: '로그아웃',
    },
    common: {
      loading: '로딩중...',
      save: '저장',
      cancel: '취소',
      edit: '편집',
      delete: '삭제',
      search: '검색',
      filter: '필터',
      difficulty: '난이도',
      easy: '쉬움',
      medium: '보통',
      hard: '어려움',
      date: '날짜',
      language: '언어',
      email: '이메일',
      password: '비밀번호',
      nativeLanguage: '모국어',
      targetLanguage: '학습언어',
      created: '생성일',
      updated: '수정일',
      total: '총',
      accuracy: '정확도',
      score: '점수',
      correct: '정답',
      incorrect: '오답',
      next: '다음',
      previous: '이전',
      close: '닫기',
      apply: '적용',
      reset: '초기화',
      clear: '지우기',
    },
    auth: {
      signIn: '로그인',
      signUp: '회원가입',
      signOut: '로그아웃',
      createAccount: '계정 만들기',
      alreadyHaveAccount: '이미 계정이 있나요? 로그인',
      noAccount: '계정이 없나요? 회원가입',
      processing: '처리중...',
      emailPlaceholder: 'your@email.com',
      passwordPlaceholder: '••••••••',
      appTitle: 'LangLearn',
      appSubtitle: 'AI와 함께하는 스마트 언어학습',
    },
    home: {
      welcome: '안녕하세요! 👋',
      subtitle: 'AI와 함께 스마트하게 언어를 학습해보세요',
      currentLanguage: '현재 학습 언어:',
      changeLanguageHint: '사이드바에서 다른 언어로 변경할 수 있습니다',
      todayActivity: '오늘의 학습 현황',
      todayActivitySubtitle: '오늘 하루 동안의 학습 활동을 확인해보세요',
      newSentences: '새 문장 학습',
      newSentencesDesc: '오늘 새롭게 추가한 문장',
      review: '복습하기',
      reviewDesc: '오늘 복습한 문장',
      goToLearn: '학습하러 가기',
      goToReview: '복습하러 가기',
      weeklyProgress: '이번 주 진도',
      consecutiveDays: '연속 학습 중!',
      streak: '일',
    },
    learn: {
      title: '오늘의 학습',
      subtitle: '새로운 문장을 입력하고 AI가 해석해드려요',
      tips: '학습 팁',
      tipDaily: '일상에서 자주 사용하는 문장을 입력해보세요',
      tipGrammar: '문법 검사 버튼으로 정확한 문장을 작성하세요',
      tipDifficulty: '난이도를 적절히 설정하여 체계적으로 학습하세요',
      tipReview: '저장한 문장은 복습 모드에서 연습할 수 있어요',
      currentLanguage: '현재 학습 언어:',
      languageHint: '사이드바에서 다른 언어로 변경할 수 있습니다',
      enterSentence: '문장을 입력해주세요',
      difficultySettings: '난이도 설정',
      translate: 'AI 번역하기',
      translating: '번역중...',
      translationResult: '번역 결과',
      original: '원문',
      translation: '한국어 번역',
      saveSentence: '문장 저장하기',
      saved: '저장완료!',
      grammarCheck: '문법 검사',
      grammarCheckTitle: 'AI 문법 검사 기능',
      grammarCheckDesc: '수동 검사: 입력창의 문법 검사 버튼을 클릭하여 필요할 때 검사',
      manualCheck: '수동 검사',
      errorDetection: '다양한 오류 감지: 문법, 맞춤법, 구두점, 문체 오류를 모두 확인',
      instantFix: '즉시 수정: 제안된 수정사항을 클릭 한 번으로 바로 적용',
      overallFix: '전체 수정: 모든 오류를 한 번에 수정하는 옵션 제공',
      languageSpecific: '전용 문법 검사',
      languageSpecificDesc: '에 특화된 문법 검사를 제공합니다! 언어별 특성을 고려한 정확한 오류 감지와 자연스러운 표현 제안을 받아보세요.',
      clickButton: '버튼을 클릭하여 언제든지 문법을 검사할 수 있습니다.',
      audioError: '음성 재생 오류:',
      playPronunciation: '발음 듣기',
      playing: '재생 중...',
      grammarCheckError: '문법 검사 오류:',
      grammarErrors: '문법 검사 완료',
      errorsFound: '문법 오류 발견',
      checkSuggestions: '아래 제안을 확인해보세요.',
      grammarErrorType: '문법',
      spellingErrorType: '맞춤법',
      punctuationErrorType: '구두점',
      styleErrorType: '문체',
      originalText: '원문:',
      suggestion: '제안:',
      explanation: '설명',
      overallCorrection: '전체 수정 제안:',
      applyAll: '전체 적용',
      confidence: '신뢰도:',
      noErrors: '오류 없음',
      errorsDetected: '개의 오류가 발견되었습니다.',
    },
    review: {
      title: '오늘의 복습',
      subtitle: '복습 유형을 선택하고 음성으로 발음을 연습하세요',
      selectType: '복습 유형 선택',
      byDate: '날짜별 복습',
      byDateDesc: '특정 날짜에 학습한 문장들',
      byDifficulty: '난이도별 복습',
      byDifficultyDesc: '원하는 난이도의 문장들',
      mistakes: '자주 틀리는 문장',
      mistakesDesc: '정확도가 낮았던 문장들을 다시 연습해보세요',
      selectDate: '복습할 날짜 선택',
      selectDifficulty: '난이도 선택',
      currentSelection: '개 문장 준비됨',
      sentencesReady: '문장 준비됨',
      noSentences: '선택한 조건에 맞는 문장이 없습니다.',
      noSentencesHint: '다른 복습 유형을 선택하거나 \'오늘의 학습\'에서 문장을 추가해보세요.',
      speakSentence: '다음 문장을 말해보세요',
      recording: '녹음 중... 버튼을 다시 눌러 중지하세요',
      recordingHint: '마이크 버튼을 눌러 녹음을 시작하세요',
      stopRecording: '녹음 중지',
      startRecording: '녹음 시작',
      analyzing: '분석 중입니다...',
      analyze: 'AI 분석하기',
      recognized: '인식된 음성',
      correct: '정답입니다! 🎉',
      incorrect: '아쉬워요! 😊',
      similarity: '유사도:',
      answer: '정답',
      nextSentence: '다음 문장',
      tips: '복습 팁',
      tipDate: '날짜별 복습: 특정 날짜에 학습한 문장들을 체계적으로 복습',
      tipDifficulty: '난이도별 복습: 원하는 난이도의 문장들로 단계적 학습',
      tipMistakes: '자주 틀리는 문장: 약점을 집중적으로 보완',
      tipPronunciation: '발음 듣기: 원어민 발음을 들으며 정확한 발음 학습',
      audioPlaying: '발음 재생 중...',
      audioPlayingHint: '중지하려면 발음 듣기 버튼을 다시 클릭하세요.',
    },
    quiz: {
      title: '퀴즈 모드',
      subtitle: '랜덤으로 선택된 문장들로 실력을 테스트해보세요',
      quizLanguage: '퀴즈 언어:',
      quizLanguageDesc: '로 학습한 문장들 중에서 랜덤으로 출제됩니다',
      noSentences: '로 퀴즈를 풀 수 있는 문장이 없습니다.',
      noSentencesHint: '먼저 \'오늘의 학습\'에서 문장을 추가해보세요.',
      quizInfo: '퀴즈 정보',
      problems: '문제 수:',
      language: '언어:',
      rules: '퀴즈 규칙',
      rule1: '한국어 문장을 보고 발음하세요',
      rule2: 'AI가 발음의 정확도를 실시간으로 분석합니다',
      rule3: '모든 문제를 풀면 최종 점수가 표시됩니다',
      rule4: '발음 듣기 버튼으로 정답을 미리 들을 수 있어요',
      startQuiz: '퀴즈 시작하기',
      completed: '퀴즈 완료!',
      completedSubtitle: '수고하셨습니다! 결과를 확인해보세요',
      grade: '등급',
      excellent: '완벽해요! 🏆',
      great: '훌륭해요! 🎉',
      good: '잘했어요! 👏',
      nice: '좋아요! 💪',
      practice: '더 연습해봐요! 📚',
      correctRate: '정답률',
      averageSimilarity: '평균 유사도',
      tryAgain: '다시 도전하기',
      backToList: '문장 리스트로 돌아가기',
      inProgress: '퀴즈 진행 중',
      inProgressSubtitle: '음성으로 발음을 연습하고 AI가 정확도를 판별해드려요',
      problem: '문제',
      correctAnswers: '정답:',
      speakInLanguage: '로 말해보세요',
      listenPronunciation: '발음 듣기',
      showResult: '결과 보기',
      tips: '퀴즈 팁',
      tipListen: '발음 듣기 버튼으로 원어민 발음을 들어보세요',
      tipClear: '명확하고 천천히 발음하는 것이 중요해요',
      tipAI: 'AI가 음성을 인식하여 정확도를 판별해드려요',
      tipFinal: '모든 문제를 풀면 최종 점수가 표시됩니다',
    },
    sentences: {
      title: '문장 리스트',
      totalSentences: '로 총 개의 문장을 학습하고 있습니다.',
      quiz: '퀴즈',
      sentence: '문장',
      translation: '번역',
      difficulty: '난이도',
      registeredDate: '등록일',
      actions: '작업',
      noSentences: '로 등록된 문장이 없습니다.',
      noSentencesHint: '먼저 \'오늘의 학습\'에서 문장을 추가해보세요.',
      noDateRange: '선택한 날짜 범위에 해당하는 문장이 없습니다.',
      noDateRangeHint: '다른 날짜 범위를 선택하거나 필터를 초기화해보세요.',
      dateRange: '날짜 범위 선택',
      startDate: '시작 날짜',
      endDate: '종료 날짜',
      after: '이후',
      before: '이전',
      selectDateRange: '날짜 범위를 선택하세요',
      activeFilters: '활성 필터:',
      search: '검색:',
      clearAllFilters: '모든 필터 초기화',
      allDifficulties: '모든 난이도',
      editMode: '편집 모드:',
      editModeDesc: '문장을 수정하고 저장하면 AI가 자동으로 재번역합니다.',
      translating: '번역 중...',
      editError: '편집 오류:',
      audioError: '음성 재생 오류:',
      playingAudio: '발음 재생 중...',
      playingAudioHint: '중지하려면 같은 버튼을 다시 클릭하거나, 다른 문장을 재생하세요.',
      deleteConfirm: '이 문장을 삭제하시겠습니까?',
      deleteFailed: '문장 삭제에 실패했습니다.',
      saveFailed: '저장에 실패했습니다. 다시 시도해주세요.',
      cannotPlayWhileEditing: '편집 중에는 재생할 수 없습니다',
      aiTranslationPending: 'AI 번역 예정',
      aiTranslationDesc: '저장 시 자동으로 번역됩니다',
      results: '개 결과',
      tips: '문장 리스트 활용 팁',
      tipAudio: '발음 버튼을 클릭하여 원어민 발음을 들어보세요',
      tipEdit: '편집 버튼으로 문장을 수정하면 AI가 자동으로 재번역해드려요',
      tipSearch: '검색 기능으로 특정 문장을 빠르게 찾을 수 있어요',
      tipDifficulty: '난이도 필터로 체계적으로 학습 단계를 관리하세요',
      tipDateRange: '날짜 범위 필터로 특정 기간에 학습한 문장들을 확인하세요',
      tipQuiz: '퀴즈 모드로 랜덤 문장들을 테스트해보세요',
      inlineEdit: '인라인 편집 기능',
      inlineEditDesc: '문장을 바로 수정할 수 있습니다! 편집 버튼을 클릭하여 문장과 난이도를 수정하면, AI가 자동으로 한국어로 재번역해드립니다.',
      editingDisabled: '편집 중에는 음성 재생이 비활성화됩니다.',
    },
    profile: {
      title: '프로필',
      subtitle: '개인 정보와 학습 통계를 확인하세요',
      currentLanguage: '현재 선택된 언어:',
      currentLanguageDesc: '아래 통계는 학습 데이터를 기준으로 합니다',
      personalInfo: '개인 정보',
      edit: '편집',
      save: '저장',
      cancel: '취소',
      email: '이메일',
      joinDate: '가입일',
      nativeLanguage: '모국어',
      targetLanguages: '학습 언어',
      maxLanguages: '(최대 3개)',
      addLanguage: '언어 추가',
      selectLanguage: '언어 선택',
      learningStats: '학습 통계',
      learningStatsDesc: '학습 진도와 성과를 한눈에 확인하세요',
      totalSentences: '총 학습 문장',
      totalReviews: '총 복습 횟수',
      averageAccuracy: '평균 정확도',
      consecutiveDays: '연속 학습일',
      thisWeek: '이번 주',
      lastWeek: '지난 주 대비',
      streak: '연속 기록',
      totalStudyTime: '총 학습 시간',
      thisWeekActivity: '이번 주 활동',
      learningLevel: '학습 레벨',
      beginner: '초급',
      intermediate: '중급',
      advanced: '고급',
      weeklyActivity: '주간 학습 활동',
      accuracyDistribution: '정확도 분포',
      monthlyProgress: '월별 학습 진도',
      difficultyDistribution: '난이도별 문장 분포',
      weeklyAccuracy: '주간 정확도 추이',
      recentActivity: '최근 활동',
      newSentence: '새 문장',
      review: '복습',
      pronunciationPractice: '발음 연습',
      points: '점',
      hours: '시간',
      minutes: '분',
      profileUpdateSuccess: '프로필이 성공적으로 업데이트되었습니다.',
      profileUpdateFailed: '프로필 업데이트에 실패했습니다.',
      selectAtLeastOne: '최소 하나의 학습 언어를 선택해주세요.',
    },
    errors: {
      networkError: '네트워크 연결을 확인해주세요.',
      apiError: 'API 오류가 발생했습니다.',
      translationFailed: '번역에 실패했습니다.',
      grammarCheckFailed: '문법 검사에 실패했습니다.',
      audioFailed: '음성 재생에 실패했습니다.',
      saveFailed: '저장에 실패했습니다.',
      loadFailed: '데이터 로드에 실패했습니다.',
      deleteFailed: '삭제에 실패했습니다.',
      quotaExceeded: 'API 사용량이 초과되었습니다.',
      unknownError: '알 수 없는 오류가 발생했습니다.',
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
      tipGrammar: 'Use the grammar check button to write accurate sentences',
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
  return translations[locale];
}

export function t(locale: Locale, key: string): string {
  const keys = key.split('.');
  let value: any = translations[locale];
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return value || key;
}