from fastapi import APIRouter, Depends, Request, HTTPException, status
from fastapi.responses import JSONResponse
# pip install fastapi pyjwt
from middleware.middleware import auth_middleware
from models.text_analyzer import analyze_claims_plausibility
from models.text_equivilence_analyzer import check_text_meaning_similarity

import re
from collections import Counter

api_router = APIRouter(
    dependencies=[Depends(auth_middleware)]
)

@api_router.get("/ta", response_class=JSONResponse)
async def text_analyzer(req: Request):
    claim = req.query_params.get("claim")
    if not claim:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing 'claim' parameter in query string"
        )
    claim = claim.replace("-", " ")
    n = 5  # minimum number of words per claim section
    claims_raw = re.split(r'[.;?!]', claim)
    claims = []
    buffer = ""
    for section in claims_raw:
        section = section.strip()
        if not section:
            continue
        words = section.split()
        if len(words) == 0:
            continue
        if len(words) < n:
            buffer = (buffer + " " + section).strip()
        else:
            if buffer:
                claims.append(buffer)
                buffer = ""
            claims.append(section)
    if buffer:
        claims.append(buffer)

    # Get the result from analyze_claims_plausibility
    result = analyze_claims_plausibility(claims)

    # Calculate average plausibility and label
    plausibilities = []
    labels = []
    for item in result:
        plausibility = item.get("plausibility")
        label = item.get("label")
        if plausibility is not None:
            plausibilities.append(plausibility)
        if label is not None:
            labels.append(label)

    average_plausibility = sum(plausibilities) / len(plausibilities) if plausibilities else 0

    # Get the most common label as average_label
    average_label = Counter(labels).most_common(1)[0][0] if labels else None

    return {
        "result_of_analyze_claims_plausibility": result,
        "average_plausibility": average_plausibility,
        "average_label": average_label
    }
    return analyze_claims_plausibility(claims)

@api_router.get("/tea", response_class=JSONResponse)
async def text_equivilence_analyzer(req: Request):
    claim1 = req.query_params.get("claim-1")
    claim2 = req.query_params.get("claim-2")
    if not claim1 or not claim2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing 'claim-1' or 'claim-2' parameter in query string"
        )
    claim1 = claim1.replace("-", " ")
    claim2 = claim2.replace("-", " ")
    return check_text_meaning_similarity(claim1, claim2)
