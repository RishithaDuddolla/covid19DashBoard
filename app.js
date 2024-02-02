const express = require('express')
const app = express()
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
const path = require('path')
app.use(express.json())
const dbpath = path.join(__dirname, 'covid19India.db')
let db = null
const makeseverDBconnection = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000)
  } catch (e) {
    console.log(e.message)
    process.exit(1)
  }
}
const covertsnaketocamelstatetabledb = dbobject => {
  return {
    stateId: dbobject.state_id,
    stateName: dbobject.state_name,
    population: dbobject.population,
  }
}
const convertsnaketocameldistricttabledb = dbobject => {
  return {
    districtId: dbobject.district_id,
    districtName: dbobject.district_name,
    stateId: dbobject.state_id,
    cases: dbobject.cases,
    cured: dbobject.cured,
    active: dbobject.active,
    deaths: dbobject.deaths,
  }
}
makeseverDBconnection()
app.get('/states/', async (request, response) => {
  const dbquery = `Select * from state order by state_id;`
  const dbresponse = await db.all(dbquery)
  response.send(
    dbresponse.map(eachstate => covertsnaketocamelstatetabledb(eachstate)),
  )
})
app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const dbquery = `select * from state where state_id=${stateId};`
  const dbresponse = await db.get(dbquery)
  response.send(covertsnaketocamelstatetabledb(dbresponse))
})

app.post('/districts/', async (request, response) => {
  const districtdeets = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtdeets
  const dbquery = `insert into district (district_name,state_id,cases,cured,active,deaths) values ('${districtName}',${stateId},${cases},${cured},${active},${deaths});`
  const dbresponse = await db.run(dbquery)
  response.send('District Successfully Added')
})
app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const dbquery = `select * from district where district_id=${districtId};`
  const dbresponse = await db.get(dbquery)
  response.send(convertsnaketocameldistricttabledb(dbresponse))
})
app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const dbquery = `delete from district where district_id=${districtId};`
  const dbresponse = await db.run(dbquery)
  response.send('District Removed')
})
app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deets = request.body
  const {districtName, stateId, cases, cured, active, deaths} = deets
  const dbquery = `update district set district_name='${districtName}',
  state_id=${stateId},
  cases=${cases},
  cured=${cured},
  active=${active},
  deaths=${deaths} where district_id=${districtId};`
  const dbresponse = await db.run(dbquery)
  response.send('District Details Updated')
})
app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const dbquery = `select sum(cases) as totalCases,sum(cured) as totalCured,sum(active) as totalActive,sum(deaths) as totalDeaths from district where state_id=${stateId};`
  const dbresponse = await db.get(dbquery)
  response.send(dbresponse)
})
app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const dbquery = `select state.state_name as stateName from state inner join district on state.state_id=district.state_id where district.district_id=${districtId};`
  const dbresponse = await db.get(dbquery)
  response.send(dbresponse)
})

module.exports = app
