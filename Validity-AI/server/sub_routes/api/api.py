from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from middleware.middleware import auth_middleware
from models.text_analyzer import analyze_claims_plausibility
from models.text_equivilence_analyzer import check_text_meaning_similarity

import re

api_router = APIRouter(
    dependencies=[Depends(auth_middleware)]
)

@api_router.get("/ta", response_class=JSONResponse)
async def text_analyzer(req: Request, res: JSONResponse):
    if not req.__contains__("query") or req.query.params.get("claim") is None:
        res.status_code = 400
        res.body = {"error": "Missing 'claim' parameter in query string."}
        return  
    claim = req.query.params.get("claim")
    claims = re.split(r'[.;?!]', claim) 
    res.body = analyze_claims_plausibility(claims)
    return

@api_router.get("/tea", response_class=JSONResponse)
async def text_equivilence_analyzer(req: Request, res: JSONResponse):
    if not req.__contains__("query") or req.query.params.get("claim") is None:
        res.status_code = 400
        res.body = {"error": "Missing 'claim' parameter in query string."}
        return  
    claim = req.query.params.get("claim")
    claims = re.split(r'[.;?!]', claim) 
    res.body = check_text_meaning_similarity(claims)
    return
