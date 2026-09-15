"""Map a KEA college name to a Karnataka city.

KEA runs the college name and its postal address together in one field with no
delimiter, and publishes no district column we can rely on -- in the 2023/24
layout a long name overflows and swallows it. So the city is recovered from the
text, matching city spellings first and then well-known localities, which is how
the many Bengaluru addresses that never name the city are resolved.

Anything still unmatched stays None and is shown as "Not stated" rather than
guessed at. The filter defaults to every city, so an unresolved college is never
hidden from a student.
"""
import re
from typing import List, Optional, Tuple

# Canonical city -> spellings KEA actually prints.
CITY_SPELLINGS = {
    'Bengaluru': ['BENGALURU', 'BANGALORE', 'BANGLORE', 'BENGALORE'],
    'Mysuru': ['MYSURU', 'MYSORE'],
    'Hubballi': ['HUBBALLI', 'HUBLI'],
    'Dharwad': ['DHARWAD', 'DHARWARD'],
    'Belagavi': ['BELAGAVI', 'BELGAUM'],
    'Mangaluru': ['MANGALURU', 'MANGALORE', 'KODIALBAIL', 'KOTTARA'],
    'Kalaburagi': ['KALABURAGI', 'GULBARGA'],
    'Davanagere': ['DAVANAGERE', 'DAVANGERE'],
    'Shivamogga': ['SHIVAMOGGA', 'SHIMOGA'],
    'Tumakuru': ['TUMAKURU', 'TUMKUR', 'TUMKURU'],
    'Vijayapura': ['VIJAYAPURA', 'BIJAPUR'],
    'Ballari': ['BALLARI', 'BELLARY'],
    'Udupi': ['UDUPI', 'MANIPAL', 'KUNDAPURA'],
    'Hassan': ['HASSAN'], 'Mandya': ['MANDYA'], 'Raichur': ['RAICHUR'],
    'Bidar': ['BIDAR', 'BHALKI'], 'Chitradurga': ['CHITRADURGA'],
    'Kolar': ['KOLAR', 'KGF'], 'Bagalkote': ['BAGALKOT', 'BAGALKOTE', 'MUDHOL'],
    'Haveri': ['HAVERI'], 'Gadag': ['GADAG'], 'Koppal': ['KOPPAL'],
    'Yadgir': ['YADGIR', 'YADAGIRI'],
    'Chikkamagaluru': ['CHIKKAMAGALURU', 'CHIKMAGALUR', 'CHICKMAGALUR'],
    'Chikkaballapura': ['CHIKKABALLAPUR', 'CHICKBALLAPUR', 'CHIKBALLAPUR'],
    'Ramanagara': ['RAMANAGARA', 'RAMANAGAR', 'CHANNAPATNA'],
    'Uttara Kannada': ['UTTARA KANNADA', 'KARWAR', 'SIRSI', 'HONNAVAR', 'BHATKAL', 'BATKAL'],
    'Dakshina Kannada': ['DAKSHINA KANNADA', 'PUTTUR', 'BANTWAL', 'SULLIA',
                         'MOODBIDRI', 'MOODABIDRI', 'NADUPADAV'],
    'Kodagu': ['KODAGU', 'MADIKERI'], 'Chamarajanagar': ['CHAMARAJANAGARA', 'CHAMARAJANAGAR'],
    'Vijayanagara': ['VIJAYANAGARA', 'HOSPET', 'HOSAPETE', 'SIRUGUPPA'],
    'Belagavi ': ['NIPANI'],
}

# Localities that identify a city on their own. Bengaluru dominates because KEA
# prints a street address for most of its colleges and never names the city.
LOCALITIES = {
    'Bengaluru': [
        'JAYANAGAR', 'YELAHANKA', 'HSR LAYOUT', 'ELECTRONIC CITY', 'ELECTRONICS CITY',
        'HENNUR', 'MAGADI', 'KANAKAPURA', 'BOMMASANDRA', 'MARATHALLI', 'MARATHAHALLI',
        'BANASHANKARI', 'BANNERGHATTA', 'KAMMANAHALLI', 'GOTTIGERE', 'VISHWANEEDAM',
        'RAJARAJESHWARI', 'CHIKKABANAVARA', 'HOSUR ROAD', 'HOSUR-MALUR', 'JIGANI',
        'ANDRAHALLI', 'HOROMAVU', 'HORAMAVU', 'CARMELARAM', 'CHIKKABELANDUR',
        'NAGAWARA', 'HEBBAL', 'VASANTHNAGAR', 'PALACE ROAD', 'SESHADRIPURAM',
        'BASAVANAGUDI', 'RAVINDRA LAYOUT', 'PADMANABHANAGAR', 'ANANDNAGAR',
        'KUMARASWAMY LAYOUT', 'SHAVIGE MALLESHWARA', 'RAGHUVANAHALLI', 'RAGUVANAHALLI',
        'CHIKKASANDRA', 'HESARAGHATTA', 'SOLDEVANAHALLI', 'DODDAKAMMANAHALLI',
        'BEGUR', 'MUNESHWARA', 'SY NO 63 OFF MAGADI', 'AGRAHARA', 'DEVANAHALLI',
        'DODDABALLAPUR', 'NELAMANGALA', 'ANEKAL', 'ATTIBELE', 'WHITEFIELD',
        'KENGERI', 'ULSOOR', 'MALLESWARAM', 'RAJAJINAGAR', 'PEENYA', 'YESHWANTHPUR',
        'K R ROAD', 'OUTER RING ROAD', 'RING ROAD', 'BELLANDUR', 'THIRUMENAHALLI',
        'HEGDENAGAR', 'RAMAGONDANAHALLI', 'JALAHALLI', 'VIDYARANYAPURA', 'MALUR',
        'CHANNASANDRA', 'KODIGEHALLI', 'BIDARAHALLI', 'VIRGO NAGAR', 'BASAVANAPURA',
        'MUTTUGADAHALLI', 'SOUNDARYA NAGAR', 'RACE COURSE', 'SARVEPALLI RADHAKRISHNAN',
        'AVALAHALLI', 'KADUGODI', 'VARTHUR', 'SARJAPUR', 'BIDADI', 'HOSKOTE',
    ],
    'Mysuru': ['HOOTAGALLI', 'ALANAHALLY', 'ALANAHALLI', 'METAGALLI', 'K.R.S. ROAD',
               'KRS ROAD', 'BELAWADI', 'NAGUVANAHALLI', 'THANDAVAPURA', 'HULLAHALLI'],
    'Dharwad': ['VIDYAGIRI', 'TARIHAL'],
    'Hubballi': ['VIDYANAGAR', 'KESHWAPUR', 'BVB CAMPUS', 'GOKUL ROAD'],
    'Tumakuru': ['GUBBI', 'TIPATURU', 'TIPTUR', 'AGALKOTE', 'BH ROAD'],
    'Mandya': ['NAGAMANGALA', 'BHARATHI NAGARA'],
    'Kalaburagi': ['KUSNOOR'],
    'Ballari': ['H HOSALLI', 'H. HOSALLI'],
    'Udupi': ['MOODLAKATTE'],
}

_INDEX: List[Tuple[str, str]] = []
for city, spellings in CITY_SPELLINGS.items():
    for s in spellings:
        _INDEX.append((city.strip(), s))
for city, places in LOCALITIES.items():
    for s in places:
        _INDEX.append((city.strip(), s))
# Longest needle first so "BENGALURU RURAL" cannot be eaten by "BENGALURU".
_INDEX.sort(key=lambda kv: -len(kv[1]))


def city_of(name: str) -> Optional[str]:
    """Best-effort city for a KEA college name, or None when nothing is certain."""
    text = ' ' + re.sub(r'[^A-Z0-9]+', ' ', (name or '').upper()).strip() + ' '
    for city, needle in _INDEX:
        if f' {needle} ' in text:
            return city
    return None
