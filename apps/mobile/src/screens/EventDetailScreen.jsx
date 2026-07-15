import React,{useState}from"react"
import{View,Text,ScrollView,TouchableOpacity,TextInput,Alert,StyleSheet}from"react-native"
import AsyncStorage from"@react-native-async-storage/async-storage"
import{addNote}from"../api"

export default function EventDetailScreen({route,navigation}){
  const{event}=route.params
  const[showNote,setShowNote]=useState(false)
  const[noteText,setNoteText]=useState("")
  const[saving,setSaving]=useState(false)

  async function saveNote(){
    if(!noteText.trim()) return
    setSaving(true)
    try{
      const tok=await AsyncStorage.getItem("access_token")
      await addNote(event.id,noteText,tok)
      Alert.alert("Note enregistrée !")
      setNoteText(""); setShowNote(false)
    }catch(e){ Alert.alert("Erreur","Impossible d'enregistrer la note.") }
    finally{ setSaving(false) }
  }

  return(
    <ScrollView style={s.container}>
      <Text style={s.title}>{event.title}</Text>
      <Text style={s.info}>Lieu : {event.city}</Text>
      <Text style={s.info}>Début : {new Date(event.start_at).toLocaleString("fr-FR")}</Text>
      {event.end_at&&<Text style={s.info}>Fin : {new Date(event.end_at).toLocaleString("fr-FR")}</Text>}
      {event.description&&<Text style={s.desc}>{event.description}</Text>}

      {event.client&&(
        <TouchableOpacity style={s.clientBtn} onPress={()=>navigation.navigate("Client",{client:event.client})}>
          <Text style={s.clientBtnText}>Voir la fiche client →</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={s.noteBtn} onPress={()=>setShowNote(v=>!v)}>
        <Text style={s.noteBtnText}>+ Ajouter une note rapide</Text>
      </TouchableOpacity>

      {showNote&&(
        <View style={s.noteBox}>
          <TextInput value={noteText} onChangeText={setNoteText}
            placeholder="Votre note..." multiline numberOfLines={4}
            style={s.noteInput}/>
          <TouchableOpacity style={s.saveBtn} onPress={saveNote} disabled={saving}>
            <Text style={s.saveBtnText}>{saving?"Enregistrement...":"Enregistrer"}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  )
}
const s=StyleSheet.create({
  container:{flex:1,backgroundColor:"#fff",padding:16},
  title:{fontSize:20,fontWeight:"700",marginBottom:12},
  info:{fontSize:14,color:"#555",marginBottom:4},
  desc:{fontSize:14,color:"#333",lineHeight:22,marginTop:10},
  clientBtn:{backgroundColor:"#f0f7ff",borderRadius:8,padding:12,marginTop:16,alignItems:"center"},
  clientBtnText:{color:"#185FA5",fontWeight:"600"},
  noteBtn:{backgroundColor:"#000",borderRadius:8,padding:12,marginTop:12,alignItems:"center"},
  noteBtnText:{color:"#fff",fontWeight:"600"},
  noteBox:{marginTop:12},
  noteInput:{borderWidth:1,borderColor:"#ddd",borderRadius:8,padding:10,fontSize:14,minHeight:80},
  saveBtn:{backgroundColor:"#333",borderRadius:8,padding:10,alignItems:"center",marginTop:8},
  saveBtnText:{color:"#fff"}
})