
BEGIN
    DECLARE i INT DEFAULT 0;

    WHILE i < 100 DO
        INSERT INTO Cars (Name, Location)
        VALUES (
            CONCAT('Car_Name_', i + 1), 
            ST_GeomFromText(
                CONCAT(
                    'POINT(',
                    121.5 + RAND() * 0.1, -- 經度範圍 121.5 ~ 121.6
                    ' ',
                    25.0 + RAND() * 0.1, -- 緯度範圍 25.0 ~ 25.1
                    ')',
                4326
                )
            )
        );
        SET i = i + 1;
    END WHILE;
END$$