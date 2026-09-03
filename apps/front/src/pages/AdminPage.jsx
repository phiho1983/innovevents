import{useState,useEffect}from"react"
import{useNavigate}from"react-router-dom"
import Navbar from"../components/Navbar"
import HomeHeroAdmin from"../components/admin/HomeHeroAdmin"
import HomePhotosAdminTab from"../components/admin/HomePhotosAdminTab"
import{useAuth}from"../auth/useAuth"
import{getProspects,updateProspectStatus,deleteProspect}from"../api/prospects"
import{getQuotes,createQuote,sendQuote}from"../api/quotes"
import{
  getContactMessages,
  updateContactMessage,
  deleteContactMessage,
}from"../api/contactMessages"

const API=import.meta.env.VITE_API_URL||"http://localhost:8000"
const ah=()=>({
  "Content-Type":"application/json",
  "Authorization":`Bearer ${localStorage.getItem("access_token")}`,
})

const SLABELS={
  TO_CONTACT:"À contacter",
  CONTACTED:"Contacté",
  QUALIFIED:"Qualifié",
  ARCHIVED:"Archivé",
}

const SCOLORS={
  TO_CONTACT:"#fff3cd",
  CONTACTED:"#cce5ff",
  QUALIFIED:"#d4edda",
  ARCHIVED:"#f8d7da",
}

const QLABELS={
  DRAFT:"Brouillon",
  SENT:"Envoyé",
  ACCEPTED:"Accepté",
  REFUSED:"Refusé",
  CHANGE_REQUESTED:"Modif demandée",
}

const MLABELS={
  NEW:"Nouveau",
  READ:"Lu",
  REPLIED:"Répondu",
  ARCHIVED:"Archivé",
}

function list(data){
  return Array.isArray(data)
    ?data
    :(data?.results||[])
}

function formatError(error){
  return error?.detail
    ||error?.message
    ||(
      typeof error==="string"
        ?error
        :"Une erreur est survenue."
    )
}


export default function AdminPage(){
  const{user,logout}=useAuth()
  const nav=useNavigate()
  const[tab,setTab]=useState("requests")

  const tabs=[
    ["requests","Demandes"],
    ["messages","Messages"],
    ["quotes","Devis"],
    ["reviews","Avis"],
    ["users","Utilisateurs"],
    ["notes","Notes"],
    ["home","Accueil"],
  ]

  return(
    <>
      <Navbar/>

      <main
        className="container"
        style={{padding:"20px 0"}}
      >
        <div
          style={{
            display:"flex",
            justifyContent:"space-between",
            alignItems:"center",
            marginBottom:16,
          }}
        >
          <div>
            <h1 style={{margin:0}}>
              Dashboard Admin
            </h1>

            <p
              style={{
                color:"#666",
                margin:0,
              }}
            >
              {user?.username}
            </p>
          </div>

          <button
            className="btn"
            onClick={()=>{
              logout()
              nav("/")
            }}
          >
            Déconnexion
          </button>
        </div>

        <div
          style={{
            display:"flex",
            gap:4,
            marginBottom:20,
            borderBottom:"1px solid #eee",
            overflowX:"auto",
          }}
        >
          {tabs.map(([key,label])=>(
            <button
              key={key}
              onClick={()=>setTab(key)}
              style={{
                padding:"8px 16px",
                border:"none",
                background:"none",
                cursor:"pointer",
                fontWeight:
                  tab===key
                    ?"600"
                    :"400",
                borderBottom:
                  tab===key
                    ?"2px solid #000"
                    :"none",
                marginBottom:-1,
                whiteSpace:"nowrap",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {tab==="requests"&&(
          <RequestsTab currentUser={user}/>
        )}

        {tab==="messages"&&(
          <MessagesTab currentUser={user}/>
        )}

        {tab==="quotes"&&(
          <QuotesTab/>
        )}

        {tab==="reviews"&&(
          <ReviewsAdminTab/>
        )}

        {tab==="users"&&(
          <UsersRightsTab
            currentUser={user}
          />
        )}

        {tab==="notes"&&(
          <NotesTab/>
        )}

        {tab==="home"&&(
          <>
            <HomeHeroAdmin/>
            <HomePhotosAdminTab/>
          </>
        )}
      </main>
    </>
  )
}


function RequestsTab({currentUser}){
  const[requests,setRequests]=useState([])
  const[loading,setLoading]=useState(true)
  const[updating,setUpdating]=useState(null)
  const[selected,setSelected]=useState(null)
  const[error,setError]=useState("")
  const[statusFilter,setStatusFilter]=useState(
    "TO_CONTACT"
  )

  const pipelineTabs=[
    ["TO_CONTACT","À traiter"],
    ["CONTACTED","Contactées"],
    ["QUALIFIED","Qualifiées"],
    ["ARCHIVED","Archivées"],
  ]

  useEffect(()=>{
    getProspects()
      .then(data=>setRequests(list(data)))
      .catch(err=>setError(formatError(err)))
      .finally(()=>setLoading(false))
  },[])

  const counts=
    Object.fromEntries(
      pipelineTabs.map(
        ([status])=>[
          status,
          requests.filter(
            request=>
              request.status===status
          ).length,
        ]
      )
    )

  const visibleRequests=
    requests.filter(
      request=>
        request.status===statusFilter
    )

  async function changeStatus(
    id,
    status
  ){
    const previousRequest=
      requests.find(
        request=>
          request.id===id
      )

    setUpdating(id)
    setError("")

    setRequests(previous=>
      previous.map(request=>
        request.id===id
          ?{
              ...request,
              status,
            }
          :request
      )
    )

    if(selected===id){
      setSelected(null)
    }

    try{
      const updated=
        await updateProspectStatus(
          id,
          status
        )

      if(
        updated?.status
        &&updated.status!==status
      ){
        setRequests(previous=>
          previous.map(request=>
            request.id===id
              ?{
                  ...request,
                  status:
                    updated.status,
                }
              :request
          )
        )
      }
    }catch(err){
      if(previousRequest){
        setRequests(previous=>
          previous.map(request=>
            request.id===id
              ?previousRequest
              :request
          )
        )
      }

      setError(
        formatError(err)
      )
    }finally{
      setUpdating(null)
    }
  }

  async function removeRequest(id){
    const confirmed=
      window.confirm(
        "Supprimer définitivement cette demande ?"
      )

    if(!confirmed){
      return
    }

    setUpdating(id)
    setError("")

    try{
      await deleteProspect(id)

      setRequests(previous=>
        previous.filter(
          request=>
            request.id!==id
        )
      )

      if(selected===id){
        setSelected(null)
      }
    }catch(err){
      setError(
        formatError(err)
      )
    }finally{
      setUpdating(null)
    }
  }

  if(loading){
    return <p>Chargement...</p>
  }

  return(
    <div>
      <h2 style={{marginBottom:12}}>
        Demandes ({requests.length})
      </h2>

      <div
        style={{
          display:"flex",
          gap:8,
          flexWrap:"wrap",
          marginBottom:16,
        }}
      >
        {pipelineTabs.map(
          ([status,label])=>(
            <button
              key={status}
              type="button"
              onClick={()=>
                setStatusFilter(status)
              }
              style={{
                padding:"8px 12px",
                borderRadius:6,
                border:
                  statusFilter===status
                    ?"2px solid #111"
                    :"1px solid #ddd",
                background:
                  statusFilter===status
                    ?"#f5f5f5"
                    :"#fff",
                fontWeight:
                  statusFilter===status
                    ?"600"
                    :"400",
                cursor:"pointer",
              }}
            >
              {label} ({counts[status]||0})
            </button>
          )
        )}
      </div>

      {error&&(
        <p role="alert">
          {error}
        </p>
      )}

      {visibleRequests.length===0&&(
        <p>
          Aucune demande dans cette catégorie.
        </p>
      )}

      {visibleRequests.map(request=>(
        <div
          key={request.id}
          style={{
            border:"1px solid #eee",
            borderRadius:8,
            padding:14,
            marginBottom:10,
            background:"#fff",
          }}
        >
          <div
            style={{
              display:"flex",
              justifyContent:"space-between",
              alignItems:"flex-start",
              gap:12,
            }}
          >
            <div>
              <strong>
                {request.first_name}{" "}
                {request.last_name}
              </strong>

              <div
                style={{
                  fontSize:13,
                  color:"#666",
                  marginTop:4,
                }}
              >
                {request.email}

                {request.phone
                  ?` — ${request.phone}`
                  :""}
              </div>
            </div>

            <span
              style={{
                padding:"4px 8px",
                borderRadius:999,
                fontSize:12,
                background:
                  SCOLORS[request.status]
                  ||"#f5f5f5",
              }}
            >
              {
                SLABELS[
                  request.status
                ]
                ||request.status
              }
            </span>
          </div>

          <div
            style={{
              marginTop:10,
              fontSize:13,
            }}
          >
            {request.company&&(
              <div>
                Société : {request.company}
              </div>
            )}

            {request.city&&(
              <div>
                Ville : {request.city}
              </div>
            )}

            {request.event_type&&(
              <div>
                Événement : {request.event_type}
              </div>
            )}

            {request.desired_date&&(
              <div>
                Date souhaitée :{" "}
                {request.desired_date}
              </div>
            )}

            {request.participant_count!=null&&(
              <div>
                {request.participant_count} participants
              </div>
            )}

            {request.message&&(
              <p
                style={{
                  margin:"8px 0 0",
                  whiteSpace:"pre-wrap",
                }}
              >
                {request.message}
              </p>
            )}
          </div>

          <div
            style={{
              display:"flex",
              gap:8,
              flexWrap:"wrap",
              marginTop:12,
            }}
          >
            {
              request.status!=="ARCHIVED"
              &&selected!==request.id
              &&(
                <button
                  type="button"
                  onClick={()=>
                    setSelected(
                      request.id
                    )
                  }
                >
                  Créer un devis
                </button>
              )
            }

            {
              request.status==="TO_CONTACT"
              &&(
                <button
                  type="button"
                  disabled={
                    updating===request.id
                  }
                  onClick={()=>
                    changeStatus(
                      request.id,
                      "CONTACTED"
                    )
                  }
                >
                  Marquer contactée
                </button>
              )
            }

            {
              request.status==="CONTACTED"
              &&(
                <button
                  type="button"
                  disabled={
                    updating===request.id
                  }
                  onClick={()=>
                    changeStatus(
                      request.id,
                      "QUALIFIED"
                    )
                  }
                >
                  Qualifier
                </button>
              )
            }

            {
              request.status!=="ARCHIVED"
              &&(
                <button
                  type="button"
                  disabled={
                    updating===request.id
                  }
                  onClick={()=>
                    changeStatus(
                      request.id,
                      "ARCHIVED"
                    )
                  }
                >
                  Archiver
                </button>
              )
            }

            {
              request.status==="ARCHIVED"
              &&(
                <button
                  type="button"
                  disabled={
                    updating===request.id
                  }
                  onClick={()=>
                    changeStatus(
                      request.id,
                      "TO_CONTACT"
                    )
                  }
                >
                  Restaurer
                </button>
              )
            }

            {
              request.status==="ARCHIVED"
              &&currentUser?.role==="ADMIN"
              &&(
                <button
                  type="button"
                  disabled={
                    updating===request.id
                  }
                  onClick={()=>
                    removeRequest(
                      request.id
                    )
                  }
                >
                  Supprimer définitivement
                </button>
              )
            }
          </div>

          {selected===request.id&&(
            <div style={{marginTop:12}}>
              <CreateQuoteForm
                requests={requests}
                initialRequestId={
                  request.id
                }
                requestName={
                  `${request.first_name} ${request.last_name}`
                }
                onSuccess={()=>
                  setSelected(null)
                }
                onCancel={()=>
                  setSelected(null)
                }
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}


function MessagesTab({currentUser}){
  const[messages,setMessages]=useState([])
  const[loading,setLoading]=useState(true)
  const[busy,setBusy]=useState(null)
  const[error,setError]=useState("")
  const[statusFilter,setStatusFilter]=useState(
    "NEW"
  )

  const pipelineTabs=[
    ["NEW","Nouveaux"],
    ["READ","Lus"],
    ["REPLIED","Répondus"],
    ["ARCHIVED","Archivés"],
  ]

  useEffect(()=>{
    getContactMessages()
      .then(data=>
        setMessages(
          list(data)
        )
      )
      .catch(err=>
        setError(
          formatError(err)
        )
      )
      .finally(()=>
        setLoading(false)
      )
  },[])

  const counts=
    Object.fromEntries(
      pipelineTabs.map(
        ([status])=>[
          status,
          messages.filter(
            message=>
              message.status===status
          ).length,
        ]
      )
    )

  const visibleMessages=
    messages.filter(
      message=>
        message.status===statusFilter
    )

  async function setStatus(
    id,
    status
  ){
    const previousMessage=
      messages.find(
        message=>
          message.id===id
      )

    setBusy(id)
    setError("")

    setMessages(previous=>
      previous.map(message=>
        message.id===id
          ?{
              ...message,
              status,
            }
          :message
      )
    )

    try{
      const updated=
        await updateContactMessage(
          id,
          {status}
        )

      if(
        updated?.status
        &&updated.status!==status
      ){
        setMessages(previous=>
          previous.map(message=>
            message.id===id
              ?{
                  ...message,
                  status:
                    updated.status,
                }
              :message
          )
        )
      }
    }catch(err){
      if(previousMessage){
        setMessages(previous=>
          previous.map(message=>
            message.id===id
              ?previousMessage
              :message
          )
        )
      }

      setError(
        formatError(err)
      )
    }finally{
      setBusy(null)
    }
  }

  async function removeMessage(id){
    const confirmed=
      window.confirm(
        "Supprimer définitivement ce message ?"
      )

    if(!confirmed){
      return
    }

    setBusy(id)
    setError("")

    try{
      await deleteContactMessage(id)

      setMessages(previous=>
        previous.filter(
          message=>
            message.id!==id
        )
      )
    }catch(err){
      setError(
        formatError(err)
      )
    }finally{
      setBusy(null)
    }
  }

  if(loading){
    return <p>Chargement...</p>
  }

  return(
    <div>
      <h2>
        Messages ({messages.length})
      </h2>

      <div
        style={{
          display:"flex",
          gap:8,
          flexWrap:"wrap",
          marginBottom:16,
        }}
      >
        {pipelineTabs.map(
          ([status,label])=>(
            <button
              key={status}
              type="button"
              onClick={()=>
                setStatusFilter(status)
              }
              style={{
                padding:"8px 12px",
                borderRadius:6,
                border:
                  statusFilter===status
                    ?"2px solid #111"
                    :"1px solid #ddd",
                background:
                  statusFilter===status
                    ?"#f5f5f5"
                    :"#fff",
                fontWeight:
                  statusFilter===status
                    ?"600"
                    :"400",
                cursor:"pointer",
              }}
            >
              {label} ({counts[status]||0})
            </button>
          )
        )}
      </div>

      {error&&(
        <p role="alert">
          {error}
        </p>
      )}

      {visibleMessages.length===0&&(
        <p>
          Aucun message dans cette catégorie.
        </p>
      )}

      {visibleMessages.map(message=>(
        <div
          key={message.id}
          style={{
            border:"1px solid #eee",
            borderRadius:8,
            padding:14,
            marginBottom:10,
            background:"#fff",
          }}
        >
          <div
            style={{
              display:"flex",
              justifyContent:"space-between",
              alignItems:"flex-start",
              gap:12,
            }}
          >
            <strong>
              {message.name}
            </strong>

            <span
              style={{
                padding:"4px 8px",
                borderRadius:999,
                fontSize:12,
                background:{
                  NEW:"#fff3cd",
                  READ:"#cce5ff",
                  REPLIED:"#d4edda",
                  ARCHIVED:"#f8d7da",
                }[message.status]
                ||"#f5f5f5",
              }}
            >
              {
                MLABELS[
                  message.status
                ]
                ||message.status
              }
            </span>
          </div>

          <div
            style={{
              fontSize:13,
              color:"#666",
              marginTop:4,
            }}
          >
            {message.email}
          </div>

          {message.subject&&(
            <h3
              style={{
                marginBottom:6,
              }}
            >
              {message.subject}
            </h3>
          )}

          <p
            style={{
              whiteSpace:"pre-wrap",
            }}
          >
            {message.message}
          </p>

          <div
            style={{
              display:"flex",
              gap:8,
              flexWrap:"wrap",
            }}
          >
            {message.status==="NEW"&&(
              <button
                type="button"
                disabled={
                  busy===message.id
                }
                onClick={()=>
                  setStatus(
                    message.id,
                    "READ"
                  )
                }
              >
                Marquer comme lu
              </button>
            )}

            {message.status==="READ"&&(
              <button
                type="button"
                disabled={
                  busy===message.id
                }
                onClick={()=>
                  setStatus(
                    message.id,
                    "REPLIED"
                  )
                }
              >
                Marquer répondu
              </button>
            )}

            {message.status!=="ARCHIVED"&&(
              <button
                type="button"
                disabled={
                  busy===message.id
                }
                onClick={()=>
                  setStatus(
                    message.id,
                    "ARCHIVED"
                  )
                }
              >
                Archiver
              </button>
            )}

            {message.status==="ARCHIVED"&&(
              <button
                type="button"
                disabled={
                  busy===message.id
                }
                onClick={()=>
                  setStatus(
                    message.id,
                    "NEW"
                  )
                }
              >
                Restaurer
              </button>
            )}

            {
              message.status==="ARCHIVED"
              &&currentUser?.role==="ADMIN"
              &&(
                <button
                  type="button"
                  disabled={
                    busy===message.id
                  }
                  onClick={()=>
                    removeMessage(
                      message.id
                    )
                  }
                >
                  Supprimer définitivement
                </button>
              )
            }
          </div>
        </div>
      ))}
    </div>
  )
}


function QuotesTab(){
  const[quotes,setQuotes]=useState([])
  const[requests,setRequests]=useState([])
  const[loading,setLoading]=useState(true)
  const[show,setShow]=useState(false)
  const[sending,setSending]=useState(null)
  const[error,setError]=useState("")
  const[success,setSuccess]=useState("")

  useEffect(()=>{
    Promise.all([
      getQuotes(),
      getProspects(),
    ])
      .then(([quoteData,requestData])=>{
        setQuotes(list(quoteData))
        setRequests(list(requestData))
      })
      .catch(err=>
        setError(
          formatError(err)
        )
      )
      .finally(()=>
        setLoading(false)
      )
  },[])

  async function handleSend(
    quote
  ){
    setSending(quote.id)
    setError("")
    setSuccess("")

    try{
      const result=
        await sendQuote(
          quote.id
        )

      setQuotes(previous=>
        previous.map(current=>
          current.id===quote.id
            ?{
                ...current,
                status:
                  result?.status
                  ||"SENT",
                client:
                  result?.client_id
                  ??result?.client
                  ??current.client,
              }
            :current
        )
      )

      setSuccess(
        `Devis #${quote.id} envoyé.`
      )
    }catch(err){
      setError(
        formatError(err)
      )
    }finally{
      setSending(null)
    }
  }

  return(
    <div>
      <div
        style={{
          display:"flex",
          justifyContent:"space-between",
          alignItems:"center",
          marginBottom:12,
        }}
      >
        <h2>
          Devis ({quotes.length})
        </h2>

        <button
          className="btn"
          onClick={()=>
            setShow(
              previous=>!previous
            )
          }
        >
          {show
            ?"Annuler"
            :"+ Nouveau devis"}
        </button>
      </div>

      {error&&(
        <p role="alert">
          {error}
        </p>
      )}

      {success&&(
        <p>
          {success}
        </p>
      )}

      {show&&(
        <CreateQuoteForm
          requests={requests}
          onSuccess={quote=>{
            setQuotes(previous=>[
              quote,
              ...previous,
            ])
            setShow(false)
          }}
          onCancel={()=>
            setShow(false)
          }
        />
      )}

      {loading
        ?(
          <p>
            Chargement...
          </p>
        )
        :quotes.map(quote=>(
          <div
            key={quote.id}
            style={{
              border:"1px solid #eee",
              borderRadius:8,
              padding:14,
              marginBottom:8,
              background:"#fff",
            }}
          >
            <div
              style={{
                display:"flex",
                justifyContent:"space-between",
                marginBottom:6,
              }}
            >
              <b>
                Devis #{quote.id}
              </b>

              <span
                style={{
                  padding:"2px 10px",
                  borderRadius:20,
                  fontSize:12,
                  background:{
                    DRAFT:"#f5f5f5",
                    SENT:"#cce5ff",
                    ACCEPTED:"#d4edda",
                    REFUSED:"#f8d7da",
                    CHANGE_REQUESTED:"#fff3cd",
                  }[quote.status]
                  ||"#eee",
                }}
              >
                {QLABELS[quote.status]
                  ||quote.status}
              </span>
            </div>

            <div
              style={{
                fontSize:13,
                color:"#555",
              }}
            >
              HT: {quote.total_ht}€
              {" | "}
              TVA: {quote.total_tva}€
              {" | "}
              <b>
                TTC: {quote.total_ttc}€
              </b>
            </div>

            {quote.items?.map(item=>(
              <div
                key={
                  item.id
                  ??`${item.label}-${item.amount_ht}`
                }
                style={{
                  fontSize:12,
                  color:"#888",
                  marginTop:2,
                }}
              >
                • {item.label}
                {" — "}
                {item.amount_ht}€
              </div>
            ))}

            <div
              style={{
                marginTop:8,
                display:"flex",
                gap:8,
                flexWrap:"wrap",
              }}
            >
              <a
                href={
                  `${API}/api/quotes/${quote.id}/pdf/`
                }
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize:12,
                  padding:"3px 10px",
                  border:"1px solid #ddd",
                  borderRadius:4,
                  textDecoration:"none",
                  color:"#333",
                }}
              >
                Télécharger PDF
              </a>

              {quote.status==="DRAFT"&&(
                <button
                  type="button"
                  disabled={
                    sending===quote.id
                  }
                  onClick={()=>
                    handleSend(
                      quote
                    )
                  }
                >
                  {sending===quote.id
                    ?"Envoi..."
                    :"Envoyer le devis"}
                </button>
              )}
            </div>
          </div>
        ))
      }
    </div>
  )
}


function CreateQuoteForm({
  requests=[],
  initialRequestId="",
  requestName="",
  onSuccess,
  onCancel,
}){
  const[form,setForm]=useState({
    prospect:
      initialRequestId
        ?String(initialRequestId)
        :"",
    tva_rate:"0.20",
  })

  const[items,setItems]=useState([
    {
      label:"",
      amount_ht:"",
    },
  ])

  const[loading,setLoading]=useState(false)

  const totalHT=
    items.reduce(
      (sum,item)=>
        sum
        +(parseFloat(item.amount_ht)||0),
      0
    )

  const totalTVA=
    totalHT
    *parseFloat(
      form.tva_rate||0
    )

  function updItem(
    index,
    key,
    value
  ){
    setItems(previous=>
      previous.map((item,currentIndex)=>
        currentIndex===index
          ?{
              ...item,
              [key]:value,
            }
          :item
      )
    )
  }

  async function submit(event){
    event.preventDefault()
    setLoading(true)

    const validItems=
      items
        .filter(item=>
          item.label.trim()
          &&item.amount_ht!==""
        )
        .map(item=>({
          label:
            item.label.trim(),
          amount_ht:
            item.amount_ht,
        }))

    try{
      const quote=
        await createQuote({
          prospect:
            Number(
              form.prospect
            ),
          tva_rate:
            form.tva_rate,
          items:
            validItems,
        })

      onSuccess?.(
        quote
      )
    }catch(err){
      alert(
        formatError(err)
      )
    }finally{
      setLoading(false)
    }
  }

  return(
    <div
      style={{
        background:"#f9f9f9",
        border:"1px solid #ddd",
        borderRadius:8,
        padding:16,
        marginBottom:16,
      }}
    >
      <h3
        style={{
          marginTop:0,
          marginBottom:12,
        }}
      >
        {requestName
          ? `Nouveau devis pour ${requestName}`
          : "Nouveau devis"}
      </h3>

      <form onSubmit={submit}>
        <div
          style={{
            display:"flex",
            gap:12,
            marginBottom:10,
          }}
        >
          <div style={{flex:1}}>
            <label
              htmlFor="quote-request"
              style={{
                display:"block",
                fontSize:13,
                marginBottom:3,
              }}
            >
              Demande
            </label>

            <select
              id="quote-request"
              required
              value={
                form.prospect
              }
              onChange={event=>
                setForm(previous=>({
                  ...previous,
                  prospect:
                    event.target.value,
                }))
              }
              style={{
                width:"100%",
                padding:"6px 8px",
                border:"1px solid #ddd",
                borderRadius:4,
              }}
            >
              <option value="">
                Sélectionner une demande
              </option>

              {requests
                .filter(request=>
                  request.status
                  !=="ARCHIVED"
                )
                .map(request=>(
                  <option
                    key={request.id}
                    value={request.id}
                  >
                    {request.first_name}{" "}
                    {request.last_name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="quote-vat"
              style={{
                display:"block",
                fontSize:13,
                marginBottom:3,
              }}
            >
              TVA
            </label>

            <select
              id="quote-vat"
              value={form.tva_rate}
              onChange={event=>
                setForm(previous=>({
                  ...previous,
                  tva_rate:
                    event.target.value,
                }))
              }
              style={{
                padding:"6px 8px",
                border:"1px solid #ddd",
                borderRadius:4,
              }}
            >
              <option value="0.20">
                20%
              </option>

              <option value="0.10">
                10%
              </option>

              <option value="0.055">
                5,5%
              </option>

              <option value="0.00">
                0%
              </option>
            </select>
          </div>
        </div>

        {items.map((item,index)=>(
          <div
            key={index}
            style={{
              display:"flex",
              gap:8,
              marginBottom:6,
            }}
          >
            <input
              aria-label="Libellé prestation"
              value={item.label}
              onChange={event=>
                updItem(
                  index,
                  "label",
                  event.target.value
                )
              }
              placeholder="Libellé prestation"
              style={{
                flex:2,
                padding:"6px 8px",
                border:"1px solid #ddd",
                borderRadius:4,
              }}
            />

            <input
              aria-label="Montant HT"
              type="number"
              value={item.amount_ht}
              onChange={event=>
                updItem(
                  index,
                  "amount_ht",
                  event.target.value
                )
              }
              placeholder="Montant HT €"
              style={{
                flex:1,
                padding:"6px 8px",
                border:"1px solid #ddd",
                borderRadius:4,
              }}
            />

            {items.length>1&&(
              <button
                type="button"
                onClick={()=>
                  setItems(previous=>
                    previous.filter(
                      (_,currentIndex)=>
                        currentIndex!==index
                    )
                  )
                }
              >
                ✕
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={()=>
            setItems(previous=>[
              ...previous,
              {
                label:"",
                amount_ht:"",
              },
            ])
          }
        >
          + Ajouter prestation
        </button>

        <div
          style={{
            background:"#fff",
            border:"1px solid #ddd",
            borderRadius:6,
            padding:12,
            margin:"12px 0",
            fontSize:13,
          }}
        >
          <div>
            Total HT :{" "}
            <b>
              {totalHT.toFixed(2)} €
            </b>
          </div>

          <div>
            TVA :{" "}
            <b>
              {totalTVA.toFixed(2)} €
            </b>
          </div>

          <div>
            Total TTC :{" "}
            <b>
              {(totalHT+totalTVA).toFixed(2)} €
            </b>
          </div>
        </div>

        <div
          style={{
            display:"flex",
            gap:8,
          }}
        >
          <button
            type="submit"
            className="btn"
            disabled={loading}
          >
            {loading
              ?"Création..."
              :"Créer le devis"}
          </button>

          {onCancel&&(
            <button
              type="button"
              onClick={onCancel}
            >
              Annuler
            </button>
          )}
        </div>
      </form>
    </div>
  )
}


function ReviewsAdminTab() {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(null)

  useEffect(() => {
    fetch(`${API}/api/reviews/`, {
      headers: ah(),
    })
      .then((response) => response.json())
      .then((data) => setReviews(data.results || data))
      .finally(() => setLoading(false))
  }, [])

  async function deleteReview(id) {
    if (!window.confirm("Supprimer cet avis ?")) {
      return
    }

    setBusy(id)

    try {
      const response = await fetch(`${API}/api/reviews/${id}/`, {
        method: "DELETE",
        headers: ah(),
      })

      if (!response.ok) {
        throw await response.json().catch(() => ({
          detail: `HTTP ${response.status}`,
        }))
      }

      setReviews((previousReviews) =>
        previousReviews.filter((review) => review.id !== id)
      )
    } catch (error) {
      alert("Erreur : " + JSON.stringify(error))
    } finally {
      setBusy(null)
    }
  }

  if (loading) {
    return <p>Chargement...</p>
  }

  return (
    <div>
      <h2 style={{ marginBottom: 12 }}>
        Avis clients ({reviews.length})
      </h2>

      {reviews.length === 0 && (
        <p style={{ color: "#888" }}>Aucun avis pour le moment.</p>
      )}

      {reviews.map((review) => (
        <div
          key={review.id}
          style={{
            border: "1px solid #eee",
            borderRadius: 8,
            padding: 14,
            marginBottom: 8,
            background: "#fff",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 8,
            }}
          >
            <div>
              <b>{review.author_name || "Inconnu"}</b>{" "}
              <span
                style={{
                  fontSize: 13,
                  color: "#666",
                }}
              >
                — {"★".repeat(review.rating || 5)}
              </span>
            </div>

            <span
              style={{
                fontSize: 12,
                color: "#888",
              }}
            >
              {new Date(review.created_at).toLocaleDateString("fr-FR")}
            </span>
          </div>

          <p
            style={{
              fontSize: 13,
              lineHeight: 1.6,
              margin: "0 0 8px",
            }}
          >
            {review.content}
          </p>

          <button
            onClick={() => deleteReview(review.id)}
            disabled={busy === review.id}
            style={{
              fontSize: 12,
              padding: "4px 10px",
              border: "1px solid #f5c6cb",
              borderRadius: 4,
              background: "#f8d7da",
              cursor: "pointer",
            }}
          >
            Supprimer
          </button>
        </div>
      ))}
    </div>
  )
}

function UsersRightsTab({currentUser}){
  const[users,setUsers]=useState([])
  const[loading,setLoading]=useState(true)
  const[busy,setBusy]=useState(null)
  const[error,setError]=useState("")
  const[success,setSuccess]=useState("")
  const[search,setSearch]=useState("")

  useEffect(()=>{
    fetch(`${API}/api/users-rights/`,{headers:ah()})
      .then(async response=>{
        const data=await response.json().catch(()=>null)

        if(!response.ok){
          throw data||{detail:`HTTP ${response.status}`}
        }

        return data
      })
      .then(data=>setUsers(data.results||data))
      .catch(error=>setError(formatApiError(error)))
      .finally(()=>setLoading(false))
  },[])

  const filteredUsers=users.filter(user=>{
    const query=search.trim().toLowerCase()

    if(!query){
      return true
    }

    return [
      user.username,
      user.email,
      user.first_name,
      user.last_name,
      user.role,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query)
  })

  async function updateAdminRights(userId,action){
    const isPromotion=action==="promote-admin"

    const message=isPromotion
      ?"Donner les droits admin à cet utilisateur ?"
      :"Retirer les droits admin à cet utilisateur ?"

    if(!window.confirm(message)){
      return
    }

    setBusy(userId)
    setError("")
    setSuccess("")

    try{
      const response=await fetch(
        `${API}/api/users-rights/${userId}/${action}/`,
        {
          method:"PATCH",
          headers:ah(),
        }
      )

      const data=await response.json().catch(()=>null)

      if(!response.ok){
        throw data||{detail:`HTTP ${response.status}`}
      }

      setUsers(previousUsers=>
        previousUsers.map(user=>
          user.id===userId
            ?data
            :user
        )
      )

      setSuccess(
        isPromotion
          ?`Droits admin accordés à ${data.username}.`
          :`Droits admin retirés à ${data.username}.`
      )
    }catch(error){
      setError(formatApiError(error))
    }finally{
      setBusy(null)
    }
  }

  async function deleteUser(user){
    const confirmed=window.confirm(
      `Supprimer le compte de ${user.username} ?\n\n`
      +"Le compte sera désactivé et anonymisé. "
      +"Son historique métier sera conservé."
    )

    if(!confirmed){
      return
    }

    setBusy(user.id)
    setError("")
    setSuccess("")

    try{
      const response=await fetch(
        `${API}/api/users-rights/${user.id}/`,
        {
          method:"DELETE",
          headers:ah(),
        }
      )

      if(!response.ok){
        const data=await response.json().catch(()=>null)

        throw data||{detail:`HTTP ${response.status}`}
      }

      setUsers(previousUsers=>
        previousUsers.filter(
          current=>current.id!==user.id
        )
      )

      setSuccess(
        `Compte ${user.username} supprimé.`
      )
    }catch(error){
      setError(formatApiError(error))
    }finally{
      setBusy(null)
    }
  }

  if(loading){
    return <p>Chargement...</p>
  }

  return(
    <div>
      <h2 style={{marginBottom:12}}>
        Gestion des utilisateurs
      </h2>

      <p style={{
        fontSize:13,
        color:"#666",
        marginTop:0,
        marginBottom:16,
      }}>
        Ici, l’admin connecté peut gérer les droits
        et supprimer un compte utilisateur.
      </p>

      <div style={{marginBottom:12}}>
        <input
          value={search}
          onChange={e=>setSearch(e.target.value)}
          placeholder="Rechercher par nom, email, rôle..."
          style={{
            width:"100%",
            maxWidth:420,
            padding:"8px 10px",
            border:"1px solid #ddd",
            borderRadius:6,
            boxSizing:"border-box",
          }}
        />
      </div>

      {error&&(
        <p style={{
          color:"#842029",
          background:"#f8d7da",
          border:"1px solid #f5c2c7",
          borderRadius:4,
          padding:"8px 10px",
          fontSize:13,
        }}>
          {error}
        </p>
      )}

      {success&&(
        <p style={{
          color:"#0f5132",
          background:"#d1e7dd",
          border:"1px solid #badbcc",
          borderRadius:4,
          padding:"8px 10px",
          fontSize:13,
        }}>
          {success}
        </p>
      )}

      <div style={{overflowX:"auto"}}>
        <table style={{
          width:"100%",
          borderCollapse:"collapse",
          fontSize:13,
        }}>
          <thead>
            <tr style={{background:"#f5f5f5"}}>
              {[
                "Utilisateur",
                "Email",
                "Nom",
                "Rôle",
                "Statut",
                "Action",
              ].map(header=>(
                <th
                  key={header}
                  style={{
                    padding:"8px 10px",
                    textAlign:"left",
                    borderBottom:"2px solid #ddd",
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {filteredUsers.map(user=>{
              const isCurrentUser=
                currentUser?.id===user.id

              const isAdmin=
                user.is_staff
                ||user.role==="ADMIN"
                ||user.is_superuser

              return(
                <tr
                  key={user.id}
                  style={{
                    borderBottom:"1px solid #eee",
                  }}
                >
                  <td style={{padding:"8px 10px"}}>
                    <b>{user.username}</b>

                    {isCurrentUser&&(
                      <span style={{
                        fontSize:12,
                        color:"#666",
                      }}>
                        {" "}— vous
                      </span>
                    )}
                  </td>

                  <td style={{padding:"8px 10px"}}>
                    {user.email?(
                      <a href={`mailto:${user.email}`}>
                        {user.email}
                      </a>
                    ):"—"}
                  </td>

                  <td style={{padding:"8px 10px"}}>
                    {
                      [
                        user.first_name,
                        user.last_name,
                      ]
                        .filter(Boolean)
                        .join(" ")
                      ||"—"
                    }
                  </td>

                  <td style={{padding:"8px 10px"}}>
                    {user.role||"—"}
                  </td>

                  <td style={{padding:"8px 10px"}}>
                    {
                      user.is_superuser
                        ?"Super admin"
                        :isAdmin
                          ?"Admin"
                          :"Utilisateur"
                    }
                  </td>

                  <td style={{padding:"8px 10px"}}>
                    {user.is_superuser?(
                      <span style={{color:"#888"}}>
                        Géré côté technique
                      </span>
                    ):isCurrentUser?(
                      <span style={{color:"#888"}}>
                        Votre compte
                      </span>
                    ):(
                      <div style={{
                        display:"flex",
                        gap:8,
                        flexWrap:"wrap",
                      }}>
                        {isAdmin?(
                          <button
                            onClick={()=>
                              updateAdminRights(
                                user.id,
                                "remove-admin"
                              )
                            }
                            disabled={busy===user.id}
                            style={{
                              fontSize:12,
                              padding:"4px 10px",
                              border:"1px solid #f5c6cb",
                              borderRadius:4,
                              background:"#f8d7da",
                              cursor:"pointer",
                            }}
                          >
                            {
                              busy===user.id
                                ?"Modification..."
                                :"Retirer droits admin"
                            }
                          </button>
                        ):(
                          <button
                            onClick={()=>
                              updateAdminRights(
                                user.id,
                                "promote-admin"
                              )
                            }
                            disabled={busy===user.id}
                            style={{
                              fontSize:12,
                              padding:"4px 10px",
                              border:"1px solid #badbcc",
                              borderRadius:4,
                              background:"#d1e7dd",
                              cursor:"pointer",
                            }}
                          >
                            {
                              busy===user.id
                                ?"Modification..."
                                :"Donner droits admin"
                            }
                          </button>
                        )}

                        <button
                          onClick={()=>deleteUser(user)}
                          disabled={busy===user.id}
                          style={{
                            fontSize:12,
                            padding:"4px 10px",
                            border:"1px solid #dc3545",
                            borderRadius:4,
                            background:"#fff",
                            color:"#dc3545",
                            cursor:"pointer",
                          }}
                        >
                          {
                            busy===user.id
                              ?"Traitement..."
                              :"Supprimer"
                          }
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}


function formatApiError(error){
  if(!error){
    return "Une erreur est survenue."
  }

  if(typeof error==="string"){
    return error
  }

  if(error.detail){
    return error.detail
  }

  return Object.entries(error)
    .map(([key,value])=>`${key} : ${Array.isArray(value)?value.join(" "):value}`)
    .join(" | ")||"Une erreur est survenue."
}

function NotesTab(){
  const[notes,setNotes]=useState([]); const[loading,setLoading]=useState(true); const[text,setText]=useState(""); const[saving,setSaving]=useState(false)
  useEffect(()=>{fetch(`${API}/api/notes/`,{headers:ah()}).then(r=>r.json()).then(d=>setNotes(d.results||d)).finally(()=>setLoading(false))},[])
  async function add(e){
    e.preventDefault(); if(!text.trim()) return; setSaving(true)
    const r=await fetch(`${API}/api/notes/`,{method:"POST",headers:ah(),body:JSON.stringify({content:text,pinned:false})})
    const n=await r.json(); setNotes(p=>[n,...p]); setText(""); setSaving(false)
  }
  return(<div>
    <h2 style={{marginBottom:12}}>Notes globales</h2>
    <form onSubmit={add} style={{marginBottom:16}}>
      <textarea value={text} onChange={e=>setText(e.target.value)} rows={3} placeholder="Ajouter une note..."
        style={{width:"100%",padding:10,border:"1px solid #ddd",borderRadius:6,marginBottom:8,boxSizing:"border-box"}}/>
      <button type="submit" className="btn" disabled={saving||!text.trim()}>{saving?"Enregistrement...":"Ajouter"}</button>
    </form>
    {loading?<p>Chargement...</p>:notes.map(n=>(
      <div key={n.id} style={{background:n.pinned?"#fff3cd":"#f9f9f9",border:"1px solid #ddd",borderRadius:6,padding:12,marginBottom:8}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,fontSize:13}}>
          <b>{n.author_name||"Inconnu"}</b><span style={{color:"#888"}}>{new Date(n.created_at).toLocaleDateString("fr-FR")}</span>
        </div>
        <p style={{margin:0,fontSize:13}}>{n.content}</p>
      </div>
    ))}
  </div>)
}
