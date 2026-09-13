-- Tie the Gemini photo quest to a real campus pin so GPS + scene checks can both run.
UPDATE quests
SET location_code = 'REC_CENTER',
    description = 'Start this quest at the Rec Center before a gym visit, then submit a photo of the gym or exercise setting while you are still on site. GPS must place you at the Rec Center; the photo checks the scene, not workout duration.'
WHERE id = '18e9c662-fbe8-45d4-905e-a5105fc0d309';
