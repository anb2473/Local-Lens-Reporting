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

    plausible_score = 0
    implausible_score = 0
    count = 0
    for claim_output in result:
        plausible_score += claim_output.get("plausible_score", 0.0)
        implausible_score += claim_output.get("implausible_score", 0.0)
        count += 1

    # Normalize to get a confidence between 0 and 1
    if plausible_score + implausible_score > 0:
        average_plausibility = plausible_score / (plausible_score + implausible_score)
    else:
        average_plausibility = 0.0

    return {
        "result_of_analyze_claims_plausibility": result,
        "average_plausibility": float(average_plausibility),
    }

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
