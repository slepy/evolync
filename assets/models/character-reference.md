# character.glb — Reference

## Hierarchia kości (53 jointy)

```
root
└── DEF-hips
    ├── DEF-spine.001
    │   └── DEF-spine.002
    │       └── DEF-spine.003
    │           ├── DEF-neck
    │           │   └── DEF-head
    │           ├── DEF-shoulder.L
    │           │   └── DEF-upper_arm.L
    │           │       └── DEF-forearm.L
    │           │           └── DEF-hand.L
    │           │               ├── DEF-f_index.01.L
    │           │               │   └── DEF-f_index.02.L
    │           │               │       └── DEF-f_index.03.L
    │           │               ├── DEF-f_middle.01.L
    │           │               │   └── DEF-f_middle.02.L
    │           │               │       └── DEF-f_middle.03.L
    │           │               ├── DEF-f_ring.01.L
    │           │               │   └── DEF-f_ring.02.L
    │           │               │       └── DEF-f_ring.03.L
    │           │               ├── DEF-f_pinky.01.L
    │           │               │   └── DEF-f_pinky.02.L
    │           │               │       └── DEF-f_pinky.03.L
    │           │               └── DEF-thumb.01.L
    │           │                   └── DEF-thumb.02.L
    │           │                       └── DEF-thumb.03.L
    │           └── DEF-shoulder.R
    │               └── DEF-upper_arm.R
    │                   └── DEF-forearm.R
    │                       └── DEF-hand.R
    │                           ├── DEF-f_index.01.R
    │                           │   └── DEF-f_index.02.R
    │                           │       └── DEF-f_index.03.R
    │                           ├── DEF-f_middle.01.R
    │                           │   └── DEF-f_middle.02.R
    │                           │       └── DEF-f_middle.03.R
    │                           ├── DEF-f_ring.01.R
    │                           │   └── DEF-f_ring.02.R
    │                           │       └── DEF-f_ring.03.R
    │                           ├── DEF-f_pinky.01.R
    │                           │   └── DEF-f_pinky.02.R
    │                           │       └── DEF-f_pinky.03.R
    │                           └── DEF-thumb.01.R
    │                               └── DEF-thumb.02.R
    │                                   └── DEF-thumb.03.R
    ├── DEF-thigh.L
    │   └── DEF-shin.L
    │       └── DEF-foot.L
    │           └── DEF-toe.L
    └── DEF-thigh.R
        └── DEF-shin.R
            └── DEF-foot.R
                └── DEF-toe.R
```

## Kluczowe kości — zakresy ruchu

Zakresy Euler XYZ w stopniach wyciągnięte ze wszystkich 45 animacji w pliku GLB (1 770 kanałów rotacji).
Osie lokalne kości (intrinsic XYZ). `*` = zakres wynikający z root-motion/śmierci — praktyczny zakres pozy jest węższy.

### Tułów / Głowa

| Kość              | Użycie                       | rotX (°)       | rotY (°)    | rotZ (°)    | Możliwe kierunki (I_POSE_TARGETS)              |
| ----------------- | ---------------------------- | -------------- | ----------- | ----------- | ---------------------------------------------- |
| `DEF-hips`        | Centralny punkt ciała        | −173..175 `*`  | −40..44     | −18..19     | —                                              |
| `DEF-spine.001`   | Kręgosłup dolny              | —              | —           | —           | —                                              |
| `DEF-spine.002`   | Kręgosłup środkowy           | −16..16        | −12..12     | −7..8       | `"up"` · `"forward"`                           |
| `DEF-spine.003`   | Klatka piersiowa             | −19..61        | −30..61     | −35..12     | `"up"` · `"forward"`                           |
| `DEF-neck`        | Szyja                        | −28..20        | −48..21     | −4..14      | `"up"` · `"forward"` · `"down"`                |
| `DEF-head`        | Głowa / kierunek patrzenia   | −43..37        | −28..44     | −18..16     | `"up"` · `"forward"` · `"down"`                |

### Lewe ramię

| Kość              | Użycie                    | rotX (°)  | rotY (°) | rotZ (°)  | Możliwe kierunki (I_POSE_TARGETS)                   |
| ----------------- | ------------------------- | --------- | -------- | --------- | --------------------------------------------------- |
| `DEF-shoulder.L`  | Link łańcucha ramienia    | −101..−79 | −15..20  | −92..−28  | —                                                   |
| `DEF-upper_arm.L` | Link łańcucha ramienia    | 58..173   | −32..82  | −176..174 | `"down"` · `"side_l"` · `"forward"` · `"up"`       |
| `DEF-forearm.L`   | Target łokcia             | −3..131   | −67..48  | −38..137  | `"down"` · `"side_l"` · `"forward"`                |
| `DEF-hand.L`      | Effektor lewego ramienia  | −57..146  | −74..81  | −100..86  | `"down"` · `"forward"` · `"up"`                    |

### Prawe ramię

| Kość              | Użycie                    | rotX (°)  | rotY (°) | rotZ (°)  | Możliwe kierunki (I_POSE_TARGETS)                   |
| ----------------- | ------------------------- | --------- | -------- | --------- | --------------------------------------------------- |
| `DEF-shoulder.R`  | Link łańcucha ramienia    | −103..−76 | −20..19  | 51..92    | —                                                   |
| `DEF-upper_arm.R` | Link łańcucha ramienia    | −158..152 | −80..46  | −179..176 | `"down"` · `"side_r"` · `"forward"` · `"up"`       |
| `DEF-forearm.R`   | Target łokcia             | −179..179 | −39..74  | −171..49  | `"down"` · `"side_r"` · `"forward"`                |
| `DEF-hand.R`      | Effektor prawego ramienia | −70..133  | −72..84  | −113..34  | `"down"` · `"forward"` · `"up"`                    |

### Lewa noga

| Kość          | Użycie              | rotX (°)      | rotY (°) | rotZ (°) | Możliwe kierunki (I_POSE_TARGETS)                    |
| ------------- | ------------------- | ------------- | -------- | -------- | ---------------------------------------------------- |
| `DEF-thigh.L` | Link łańcucha nogi  | −180..180 `*` | −2..45   | −61..11  | `"down"` · `"forward"` · `"back"` · `"side_l"`      |
| `DEF-shin.L`  | Target kolana       | −4..136       | −46..33  | −29..46  | `"down"` (kolano zgina się tylko w jedną stronę)     |
| `DEF-foot.L`  | Effektor lewej nogi | −121..−16     | −22..29  | −10..46  | `"foot"` · `"down"` · `"up"`                        |
| `DEF-toe.L`   | Końcówka stopy      | 97..149       | −4..1    | —        | — (pasywna)                                          |

### Prawa noga

| Kość          | Użycie               | rotX (°)      | rotY (°) | rotZ (°) | Możliwe kierunki (I_POSE_TARGETS)                    |
| ------------- | -------------------- | ------------- | -------- | -------- | ---------------------------------------------------- |
| `DEF-thigh.R` | Link łańcucha nogi   | −180..180 `*` | −49..6   | −11..54  | `"down"` · `"forward"` · `"back"` · `"side_r"`      |
| `DEF-shin.R`  | Target kolana        | 0..134        | −40..43  | −54..7   | `"down"` (kolano zgina się tylko w jedną stronę)     |
| `DEF-foot.R`  | Effektor prawej nogi | −126..26      | −28..21  | −43..15  | `"foot"` · `"down"` · `"up"`                        |
| `DEF-toe.R`   | Końcówka stopy       | 93..149       | −4..0    | —        | — (pasywna)                                          |

## Układ przestrzenny (World Space)

Model eksportowany z Blendera — standardowa konwersja Y-up/Z-up (obrót 90° na węźle `Rig`).

```
+Y  — góra (up)
-Y  — dół (down)
-Z  — przód postaci (forward, kierunek patrzenia)
+Z  — tył postaci (back)
-X  — lewa strona postaci (left)
+X  — prawa strona postaci (right)
```

> **Poza spoczynkowa: A-pose** — ramiona zwisają w dół, **nie** T-pose.

---

## Kierunki kości (rest pose — world space)

### Oś długości kości

Każda kość wskazuje swoim **lokalnym +Y** w kierunku swojego dziecka (tip).
Poniższe kierunki to dominująca oś wektora tip → parent w przestrzeni świata.

### Kręgosłup / Tułów

| Kość              | Kierunek tip (world) | Uwagi                                  |
| ----------------- | -------------------- | -------------------------------------- |
| `DEF-hips`        | **+Y** (up)          | Lekkie pochylenie do przodu            |
| `DEF-spine.001`   | **+Y** (up)          | Pionowo                                |
| `DEF-spine.002`   | **+Y** (up)          | Pionowo                                |
| `DEF-spine.003`   | **+Y** (up)          | Lekkie pochylenie                      |
| `DEF-neck`        | **+Y** (up)          | Lekkie pochylenie do przodu            |
| `DEF-head`        | **+Y** (up)          | Lekkie pochylenie do przodu            |

Lokalny **+X** kości kręgosłupa wskazuje w **-X world** (lewa strona).
Zginanie kręgosłupa (przód/tył) odbywa się wokół lokalnej osi **Z**.

### Lewe ramię — kierunki

| Kość              | Kierunek tip (world) | Uwagi                                        |
| ----------------- | -------------------- | -------------------------------------------- |
| `DEF-shoulder.L`  | **-X** (left)        | Bark wysuwa się na lewo                      |
| `DEF-upper_arm.L` | **-Y** (down)        | Ramię zwisa w dół — A-pose                   |
| `DEF-forearm.L`   | **-Y** (down)        | Przedramię kontynuuje w dół                  |
| `DEF-hand.L`      | **-Y** (down)        | Dłoń w dół                                   |

Palce lewej dłoni wskazują w **+X** (prawa strona świata — dłoń otwarta, palm-down).
Zginanie łokcia (flexion) odbywa się wokół lokalnej osi **Z**.

### Prawe ramię — kierunki

| Kość              | Kierunek tip (world) | Uwagi                                        |
| ----------------- | -------------------- | -------------------------------------------- |
| `DEF-shoulder.R`  | **+X** (right)       | Bark wysuwa się na prawo                     |
| `DEF-upper_arm.R` | **-Y** (down)        | Ramię zwisa w dół — A-pose                   |
| `DEF-forearm.R`   | **-Y** (down)        | Przedramię kontynuuje w dół                  |
| `DEF-hand.R`      | **-Y** (down)        | Dłoń w dół                                   |

Palce prawej dłoni wskazują w **-X** (lewa strona świata — symetrycznie).
Zginanie łokcia (flexion) odbywa się wokół lokalnej osi **Z**.

### Lewa noga — kierunki

| Kość           | Kierunek tip (world) | Uwagi                                   |
| -------------- | -------------------- | --------------------------------------- |
| `DEF-thigh.L`  | **-Y** (down)        | Udo pionowo w dół                       |
| `DEF-shin.L`   | **-Y** (down)        | Goleń pionowo w dół                     |
| `DEF-foot.L`   | **-Z** (forward)     | Stopa wskazuje do przodu postaci        |
| `DEF-toe.L`    | **-Z** (forward)     | Palce stopy do przodu                   |

### Prawa noga — kierunki

| Kość           | Kierunek tip (world) | Uwagi                                   |
| -------------- | -------------------- | --------------------------------------- |
| `DEF-thigh.R`  | **-Y** (down)        | Udo pionowo w dół                       |
| `DEF-shin.R`   | **-Y** (down)        | Goleń pionowo w dół                     |
| `DEF-foot.R`   | **-Z** (forward)     | Stopa wskazuje do przodu postaci        |
| `DEF-toe.R`    | **-Z** (forward)     | Palce stopy do przodu                   |

### Palce dłoni (lewe i prawe)

Wszystkie segmenty palców (`f_index`, `f_middle`, `f_ring`, `f_pinky`, `thumb`) wskazują w kierunku:

| Strona | Kierunek zginania | Tip direction (world) |
| ------ | ----------------- | --------------------- |
| Lewa   | palm-down         | **+X** (right)        |
| Prawa  | palm-down         | **-X** (left)         |

Zginanie palców odbywa się wokół lokalnej osi **Z** każdego segmentu.

---

## Podsumowanie osi dla IK / FK

| Operacja                          | Oś lokalna | Kierunek world        |
| --------------------------------- | ---------- | --------------------- |
| Zginanie kręgosłupa (przód/tył)   | `Z`        | przód: **-Z**         |
| Rotacja bioder (yaw)              | `Y`        | góra: **+Y**          |
| Zginanie łokcia                   | `Z`        | -                     |
| Zginanie kolana                   | `Z`        | -                     |
| Kierunek tip ramion (A-pose rest) | `+Y` local | **-Y** world (dół)    |
| Kierunek tip nóg (rest)           | `+Y` local | **-Y** world (dół)    |
| Kierunek stopy (rest)             | `+Y` local | **-Z** world (przód)  |

---

## Animacje (45)

Nazwy w Three.js używają formatu `Rig|NazwaAnimacji`.

### Lokomocja

| #   | Nazwa                   | Czas | Opis                     |
| --- | ----------------------- | ---- | ------------------------ |
| 8   | `Rig\|Idle_Loop`        | 3s   | Bezczynność (loop)       |
| 44  | `Rig\|Walk_Loop`        | 1s   | Spacer (loop)            |
| 43  | `Rig\|Walk_Formal_Loop` | 1s   | Formalny spacer (loop)   |
| 12  | `Rig\|Jog_Fwd_Loop`     | 1s   | Trucht do przodu (loop)  |
| 37  | `Rig\|Sprint_Loop`      | 1s   | Sprint (loop)            |
| 0   | `Rig\|Crouch_Fwd_Loop`  | 2s   | Chodzenie w kucki (loop) |
| 1   | `Rig\|Crouch_Idle_Loop` | 3s   | Kucanie bezczynne (loop) |

### Skok

| #   | Nazwa             | Czas | Opis                    |
| --- | ----------------- | ---- | ----------------------- |
| 15  | `Rig\|Jump_Start` | 1s   | Rozpoczęcie skoku       |
| 14  | `Rig\|Jump_Loop`  | 3s   | Skok w powietrzu (loop) |
| 13  | `Rig\|Jump_Land`  | 1s   | Lądowanie po skoku      |
| 27  | `Rig\|Roll`       | 1s   | Przewrót                |
| 28  | `Rig\|Roll_RM`    | 1s   | Przewrót (root motion)  |

### Pływanie

| #   | Nazwa                 | Czas | Opis                      |
| --- | --------------------- | ---- | ------------------------- |
| 38  | `Rig\|Swim_Fwd_Loop`  | 1s   | Pływanie do przodu (loop) |
| 39  | `Rig\|Swim_Idle_Loop` | 3s   | Pływanie bezczynne (loop) |

### Walka wręcz

| #   | Nazwa                  | Czas | Opis                       |
| --- | ---------------------- | ---- | -------------------------- |
| 24  | `Rig\|Punch_Enter`     | 1s   | Wejście w postawę walki    |
| 25  | `Rig\|Punch_Jab`       | 1s   | Cios prosty                |
| 23  | `Rig\|Punch_Cross`     | 1s   | Cios krzyżowy              |
| 40  | `Rig\|Sword_Attack`    | 2s   | Atak mieczem               |
| 41  | `Rig\|Sword_Attack_RM` | 2s   | Atak mieczem (root motion) |
| 42  | `Rig\|Sword_Idle`      | 2s   | Bezczynność z mieczem      |

### Broń palna

| #   | Nazwa                     | Czas | Opis                            |
| --- | ------------------------- | ---- | ------------------------------- |
| 20  | `Rig\|Pistol_Idle_Loop`   | 2s   | Bezczynność z pistoletem (loop) |
| 17  | `Rig\|Pistol_Aim_Down`    | <1s  | Celowanie w dół                 |
| 18  | `Rig\|Pistol_Aim_Neutral` | <1s  | Celowanie prosto                |
| 19  | `Rig\|Pistol_Aim_Up`      | <1s  | Celowanie w górę                |
| 22  | `Rig\|Pistol_Shoot`       | 1s   | Strzał                          |
| 21  | `Rig\|Pistol_Reload`      | 2s   | Przeładowanie                   |

### Magia

| #   | Nazwa                         | Czas | Opis                        |
| --- | ----------------------------- | ---- | --------------------------- |
| 33  | `Rig\|Spell_Simple_Enter`     | 1s   | Wejście w czar              |
| 35  | `Rig\|Spell_Simple_Idle_Loop` | 2s   | Bezczynność z czarem (loop) |
| 36  | `Rig\|Spell_Simple_Shoot`     | 1s   | Rzucenie czaru              |
| 34  | `Rig\|Spell_Simple_Exit`      | <1s  | Zakończenie czaru           |

### Siedzenie

| #   | Nazwa                       | Czas | Opis                       |
| --- | --------------------------- | ---- | -------------------------- |
| 29  | `Rig\|Sitting_Enter`        | 1s   | Siadanie                   |
| 31  | `Rig\|Sitting_Idle_Loop`    | 2s   | Siedzenie bezczynne (loop) |
| 32  | `Rig\|Sitting_Talking_Loop` | 3s   | Siedzenie i rozmowa (loop) |
| 30  | `Rig\|Sitting_Exit`         | 1s   | Wstawanie                  |

### Interakcje

| #   | Nazwa                  | Czas | Opis                    |
| --- | ---------------------- | ---- | ----------------------- |
| 11  | `Rig\|Interact`        | 2s   | Interakcja              |
| 16  | `Rig\|PickUp_Table`    | 1s   | Podnoszenie ze stołu    |
| 26  | `Rig\|Push_Loop`       | 3s   | Pchanie (loop)          |
| 5   | `Rig\|Fixing_Kneeling` | 5s   | Naprawianie na kolanach |
| 4   | `Rig\|Driving_Loop`    | 2s   | Prowadzenie (loop)      |

### Inne

| #   | Nazwa                    | Czas | Opis                           |
| --- | ------------------------ | ---- | ------------------------------ |
| 2   | `Rig\|Dance_Loop`        | 1s   | Taniec (loop)                  |
| 9   | `Rig\|Idle_Talking_Loop` | 3s   | Rozmowa bezczynna (loop)       |
| 10  | `Rig\|Idle_Torch_Loop`   | 1s   | Bezczynność z pochodnią (loop) |
| 3   | `Rig\|Death01`           | 2s   | Śmierć                         |
| 6   | `Rig\|Hit_Chest`         | <1s  | Trafienie w klatkę             |
| 7   | `Rig\|Hit_Head`          | <1s  | Trafienie w głowę              |
