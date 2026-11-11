# SupeRR Selector 2.0: Technical Methodology & Analytical Report
## Rajasthan Royals • Advanced Cricket Performance Intelligence Platform

---

### Executive Summary

In high-stakes Twenty20 cricket, standard aggregate statistics (overall Strike Rate, Batting Average, Economy Rate) frequently mischaracterize a player's true tactical value by conflating garbage-time scoring in decided games with match-defining execution in crunch situations.

**SupeRR Selector 2.0** solves this problem through a reproducible, mathematically grounded intelligence framework that evaluates **200,999 historical deliveries across 883 matches** in the Indian Premier League (IPL) and T20 Internationals (2022–2026). Every delivery is classified using a multi-factor **Pressure Index ($P \in [0, 1]$)**. Players are ranked by their ability to outperform baseline expectations under high-leverage constraints.

---

### 1. Official Final Rankings (For Unstop Dropdown Submission)

#### Top 10 Batters Under Pressure
| Rank | Player Name | Franchise / Team | Pressure SR | Baseline SR | SR Delta (Improvement) | Boundary % | BPI Rating |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **1** | **Namboori Tilak Varma** | Mumbai Indians | 192.5 | 139.4 | **+53.1** | 22.6% | **95.1** |
| **2** | **Tristan Stubbs** | Delhi Capitals | 195.6 | 141.8 | **+53.8** | 23.4% | **95.0** |
| **3** | **Rinku Singh** | Kolkata Knight Riders | 220.7 | 144.5 | **+76.3** | 25.7% | **94.5** |
| **4** | **Mahendra Singh Dhoni** | Chennai Super Kings | 172.9 | 138.4 | **+34.5** | 21.9% | **93.1** |
| **5** | **Matthew Wade** | Gujarat Titans / Australia | 170.5 | 129.4 | **+41.1** | 21.6% | **92.1** |
| **6** | **Towhid Hridoy** | Bangladesh | 187.0 | 122.6 | **+64.5** | 22.2% | **92.0** |
| **7** | **Naman Dhir** | Mumbai Indians | 230.1 | 160.0 | **+70.1** | 27.4% | **92.0** |
| **8** | **Aiden Markram** | Sunrisers Hyderabad / SA | 203.2 | 140.9 | **+62.3** | 24.2% | **91.9** |
| **9** | **Nitish Reddy** | Sunrisers Hyderabad | 216.7 | 144.7 | **+71.9** | 25.9% | **91.7** |
| **10** | **David Miller** | Gujarat Titans / SA | 193.7 | 142.0 | **+51.8** | 22.9% | **91.2** |

#### Top 10 Bowlers Under Pressure
| Rank | Player Name | Style / Team | Pressure Econ | Baseline Econ | Economy Suppression | Dot Ball % | Pressure Wickets | BPI-Bowl Rating |
| :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **1** | **Shadab Khan** | Leg-Break / Pakistan | 4.89 | 8.14 | **+3.26** | 47.1% | 8 | **90.9** |
| **2** | **Mohammad Nawaz** | Slow Left-Arm / Pakistan | 5.08 | 7.25 | **+2.17** | 52.5% | 8 | **87.1** |
| **3** | **Mayank Yadav** | Right-Arm Fast / LSG | 7.16 | 9.58 | **+2.43** | 45.6% | 5 | **84.3** |
| **4** | **Jamie Overton** | Fast / England | 7.12 | 8.77 | **+1.66** | 45.8% | 6 | **83.3** |
| **5** | **Abrar Ahmed** | Leg-Break / Pakistan | 4.25 | 6.91 | **+2.66** | 56.9% | 4 | **81.8** |
| **6** | **Shaheen Afridi** | Left-Arm Fast / Pakistan | 7.15 | 8.01 | **+0.87** | 40.9% | 11 | **81.2** |
| **7** | **Sakib Hussain** | Fast / KKR | 7.30 | 9.92 | **+2.62** | 33.3% | 5 | **80.6** |
| **8** | **Yuzvendra Chahal** | Leg-Break / Rajasthan Royals | 7.63 | 8.70 | **+1.07** | 36.7% | **22** | **79.6** |
| **9** | **Tim Southee** | Fast-Medium / NZ / KKR | 7.30 | 8.43 | **+1.13** | 35.9% | 10 | **79.4** |
| **10** | **Jasprit Bumrah** | Right-Arm Fast / MI | 6.54 | 7.22 | **+0.68** | 42.1% | 9 | **78.7** |

---

### 2. Pressure Formulation

#### Second Innings (Target Chase)
$$\text{Pressure}_{\text{chase}} = \left[ 0.42 \cdot f(\text{RRR}) + 0.30 \cdot \left(\frac{W_{\text{lost}}}{10}\right) + 0.28 \cdot \text{PhaseUrgency}(\text{Balls}_{\text{rem}}) \right] \cdot \text{ClosenessModifier}$$

- **Anti-Climax Safeguard:** If runs required $\le 12$ with $\ge 6$ wickets in hand, a $0.35\times$ closeness modifier prevents score inflation. If $\le 36$ balls remain with $\le 50$ runs needed and $\ge 3$ wickets, a $1.25\times$ nail-biter multiplier is triggered.

#### First Innings (Setting a Total)
$$\text{Pressure}_{\text{first}} = 0.40 \cdot \text{CollapseFactor}(W, \text{Overs}) + 0.45 \cdot \text{DeathPhase}(\text{Overs}, W_{\text{hand}}) + 0.15 \cdot \text{ScoringHealth}(\text{CRR})$$

---

### 3. Rating Models

#### Batting Pressure Index (BPI)
$$\text{BPI} = \text{BPI}_{\text{raw}} \cdot \left[ 0.68 + 0.32 \cdot \sqrt{\frac{\min(\text{Balls}, 240)}{240}} \right]$$
where:
$$\text{BPI}_{\text{raw}} = 0.35 \cdot \min\left(100, \frac{\text{SR}_{\text{press}}}{165} \cdot 100\right) + 0.25 \cdot \text{clamp}(50 + 1.4 \cdot \Delta\text{SR}, 0, 100) + 0.20 \cdot \min\left(100, \frac{\text{RPD}}{42} \cdot 100\right) + 0.10 \cdot \min\left(100, \frac{\text{Bdry}\%}{24} \cdot 100\right) + 0.10 \cdot \text{Consistency}$$

#### Bowling Pressure Index (BPI-Bowl)
$$\text{BPI}_{\text{bowl}} = \text{BPI}_{\text{bowl\_raw}} \cdot \left[ 0.68 + 0.32 \cdot \sqrt{\frac{\min(\text{Balls}, 240)}{240}} \right]$$
where:
$$\text{BPI}_{\text{bowl\_raw}} = 0.35 \cdot \text{clamp}\left(\frac{12.0 - \text{Econ}_{\text{press}}}{5.2} \cdot 100, 0, 100\right) + 0.25 \cdot \text{clamp}(50 + 14 \cdot \Delta\text{Econ}, 0, 100) + 0.20 \cdot \text{clamp}\left(\frac{30 - \min(30, \text{WktSR})}{20} \cdot 100, 0, 100\right) + 0.10 \cdot \min\left(100, \frac{\text{Dot}\%}{46} \cdot 100\right) + 0.10 \cdot \text{Consistency}$$

---

### 4. Data Processing Guarantees
- Extras handling strictly distinguishes wides/no-balls (charged to bowler) from byes/leg-byes (unearned by bowler).
- Dismissals credited to bowlers strictly exclude run-outs, retired out, and obstructing the field.
- Dynamic match-state reconstruction computes exact cumulative scores and DLS revised targets ball by ball.

