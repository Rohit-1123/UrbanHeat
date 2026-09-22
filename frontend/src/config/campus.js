export const SRM_CAMPUS = {
  center: [12.8237, 80.0444],
  bounds: [
    [12.8188, 80.0372],
    [12.8280, 80.0516]
  ],
  places: [
    { name: 'SRM Main Campus', lat: 12.8233, lon: 80.0435, category: 'Overall campus' },
    { name: 'Main Block', lat: 12.8240, lon: 80.0427, category: 'Main academic area' },
    { name: 'University Building / Administrative Building', lat: 12.82331, lon: 80.04245, category: 'Administration and library' },
    { name: 'SRM Central Library', lat: 12.8235, lon: 80.0426, category: 'University Building area' },
    { name: 'Tech Park', lat: 12.8234, lon: 80.0446, category: 'Tech Park and food court' },
    { name: 'Raman Research Park', lat: 12.8230, lon: 80.0448, category: 'Research area' },
    { name: 'CRC Block', lat: 12.8245, lon: 80.0430, category: 'Classroom complex' },
    { name: 'Hi-Tech Block', lat: 12.8250, lon: 80.0430, category: 'Engineering' },
    { name: 'ES Block', lat: 12.8255, lon: 80.0425, category: 'EEE and Electronics' },
    { name: 'Mechanical A-E', lat: 12.8260, lon: 80.0415, category: 'Mechanical Engineering' },
    { name: 'Automobile Block', lat: 12.8265, lon: 80.0408, category: 'Automobile Engineering' },
    { name: 'Mechanical Hanger', lat: 12.8270, lon: 80.0405, category: 'Mechanical labs' },
    { name: 'Aerospace Hanger', lat: 12.8272, lon: 80.0400, category: 'Aerospace' },
    { name: 'Structural Testing Lab', lat: 12.8265, lon: 80.0398, category: 'Civil and structural' },
    { name: 'Basic Engineering Lab (BEL)', lat: 12.8235, lon: 80.0415, category: 'Engineering labs' },
    { name: 'MBA Block', lat: 12.8230, lon: 80.0410, category: 'Management' },
    { name: 'Biotechnology Block', lat: 12.8225, lon: 80.0405, category: 'Biotechnology' },
    { name: 'Kalam Block', lat: 12.8240, lon: 80.0415, category: 'Academic' },
    { name: 'PG Block', lat: 12.8245, lon: 80.0420, category: 'Postgraduate' },
    { name: 'Old Library / Civil Block', lat: 12.8245, lon: 80.0415, category: 'Civil Engineering' },
    { name: 'Dr. T.P. Ganesan Auditorium', lat: 12.8240, lon: 80.0460, category: 'Major auditorium' },
    { name: 'Sports Complex', lat: 12.8250, lon: 80.0470, category: 'Sports area' },
    { name: 'Cricket Ground', lat: 12.8260, lon: 80.0470, category: 'Sports' },
    { name: 'Football Ground', lat: 12.8270, lon: 80.0470, category: 'Sports' },
    { name: 'Indoor Game Studio', lat: 12.8250, lon: 80.0460, category: 'Indoor sports' },
    { name: 'Fab Lab', lat: 12.8240, lon: 80.0460, category: 'Innovation' },
    { name: 'SRM Medical College Hospital', lat: 12.8190, lon: 80.0500, category: 'Medical campus' },
    { name: 'M Block Girls Hostel', lat: 12.8195, lon: 80.0470, category: 'Hostel area' },
    { name: 'Meenakshi Hostel', lat: 12.8220, lon: 80.0430, category: 'Girls hostel' },
    { name: 'Food Court - Tech Park', lat: 12.823418, lon: 80.044586, category: 'Food court' },
    { name: 'Inspiration Studio Hall', lat: 12.823573, lon: 80.043505, category: 'DEI' }
  ],
  landmarks: [
    {
      name: 'SRM Main Gate to Tech Park',
      start: { lat: 12.8232, lon: 80.0450 },
      end: { lat: 12.8246527, lon: 80.0452877 }
    },
    {
      name: 'SRM Library to Hospital',
      start: { lat: 12.8232845, lon: 80.0425857 },
      end: { lat: 12.8210402, lon: 80.0479585 }
    },
    {
      name: 'SRM Auditorium Road to Library',
      start: { lat: 12.8244209, lon: 80.0460157 },
      end: { lat: 12.8232845, lon: 80.0425857 }
    },
    {
      name: 'SRM Hospital to Tech Park',
      start: { lat: 12.8210402, lon: 80.0479585 },
      end: { lat: 12.8246527, lon: 80.0452877 }
    },
    {
      name: 'SRM Main Gate to Library',
      start: { lat: 12.8232, lon: 80.0450 },
      end: { lat: 12.8232845, lon: 80.0425857 }
    }
  ]
};

export const isWithinSrmCampus = (lat, lon) => (
  Number.isFinite(lat)
  && Number.isFinite(lon)
  && lat >= SRM_CAMPUS.bounds[0][0]
  && lat <= SRM_CAMPUS.bounds[1][0]
  && lon >= SRM_CAMPUS.bounds[0][1]
  && lon <= SRM_CAMPUS.bounds[1][1]
);
