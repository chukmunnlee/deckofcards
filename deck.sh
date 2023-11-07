#!/bin/bash

clear

#curl -sq -X GET http://localhost:3000/api/decks | jq

curl -sq -X POST http://localhost:3000/api/deck \
	-H 'Content-Type: application/json' \
	-H 'Accept: application/json' \
	--data '{ "shuffle": true, "deck_name": "uno" }' | jq

#DECK_ID="01HCM2CJ489E1MYA2R8N70P3HD"

#curl -sq -X GET http://localhost:3000/api/deck/${DECK_ID}?count=3 | jq
 
#curl -sq -X DELETE http://localhost:3000/api/deck/${DECK_ID} | jq
#curl -sq -X PUT http://localhost:3000/api/deck/${DECK_ID} | jq
#curl -sq -X GET http://localhost:3000/api/deck/${DECK_ID}/status | jq
#curl -sq -X GET http://localhost:3000/api/deck/${DECK_ID}/back | jq
 
#curl -sq -X GET http://localhost:3000/api/deck/${DECK_ID}/contents | jq
#curl -sq -X GET http://localhost:3000/api/deck/${DECK_ID}/pile/discarded/contents | jq

#curl -sq -X PATCH "http://localhost:3000/api/deck/${DECK_ID}?cards=Y5,GR,r5&strict=true" | jq
#curl -sq -X PATCH "http://localhost:3000/api/deck/${DECK_ID}?cards=Y5,-GR,R5" | jq
#curl -sq -X PATCH http://localhost:3000/api/deck/${DECK_ID}/pile/discarded?cards=Y5,GR,R5 | jq
 
#curl -sq -X GET http://localhost:3000/api/deck/${DECK_ID}/piles | jq

#curl -sq -X GET http://localhost:3000/api/deck/${DECK_ID}/pile/discarded | jq
#
#curl -sq -X PUT http://localhost:3000/api/deck/${DECK_ID}/pile/discarded | jq
