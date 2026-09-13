-- Campus quests verify with on-site GPS + Gemini photo evidence. No QR check-ins.
UPDATE quests
SET verification_policy = 'PHOTO_AI',
    description = CASE location_code
      WHEN 'LIBRARY' THEN 'Go to the University Library, then submit a photo of the library or a study setting while GPS places you on site.'
      WHEN 'REC_CENTER' THEN 'Go to the Student Recreation Center, then submit a photo of the gym or exercise setting while GPS places you on site.'
      WHEN 'CAREER_CENTER' THEN 'Go to the Career Center, then submit a photo of the office or advising area while GPS places you on site.'
      WHEN 'STUDENT_UNION' THEN 'Go to the Student Union, then submit a photo of the union atrium, event space, or clear union signage while GPS places you on site.'
      WHEN 'HACKATHON' THEN 'Arrive at the hackathon venue, then submit a photo of the event floor, team tables, or check-in area while GPS places you on site.'
      ELSE description
    END
WHERE verification_policy = 'QR' AND location_code IS NOT NULL;

-- Keep the timed workout quest distinct from the quick Rec Center photo quest.
UPDATE quests
SET description = 'Start this quest at the Rec Center before a longer gym visit, then submit a photo of the gym or exercise setting while you are still on site. GPS must place you at the Rec Center; the photo checks the scene, not workout duration.'
WHERE id = '18e9c662-fbe8-45d4-905e-a5105fc0d309';
