-- Point the hackathon quest at the Innovation Hub and make photo verification match the venue.
UPDATE quests
SET title = 'Hackathon Check-in',
    description = 'Go to the TTU Innovation Hub at Research Park (3911 4th St), then submit a photo of the hackathon floor, team tables, Hub signage, or check-in area while GPS places you on site.',
    verification_policy = 'PHOTO_AI',
    location_code = 'HACKATHON'
WHERE location_code = 'HACKATHON'
   OR title ILIKE '%hackathon%';
