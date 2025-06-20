from fastapi import APIRouter, Depends, Request, HTTPException, status
from fastapi.responses import JSONResponse
# pip install fastapi pyjwt
from middleware.middleware import auth_middleware
from models.text_analyzer import analyze_claims_plausibility
from models.text_equivilence_analyzer import check_text_meaning_similarity

import re

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
    claims = re.split(r'[.;?!]', claim)
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
