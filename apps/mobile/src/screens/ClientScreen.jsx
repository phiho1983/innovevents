import React from"react"
import{View,Text,TouchableOpacity,Linking,StyleSheet,Alert}from"react-native"

export default function ClientScreen({route}){
  const{client}=route.params

  function call(){
    if(!client.phone){ Alert.alert("Pas de numéro"); return }
    Linking.openURL(`tel:${client.phone}`)
  }
  function mail(){
    if(!client.email){ Alert.alert("Pas d'email"); return }
    Linking.openURL(`mailto:${client.email}`)
  }
  function maps(){
    const addr=encodeURIComponent(client.address||client.city||"Paris")
    Linking.openURL(`https://www.google.com/maps/search/${addr}`)
  }

  return(
    <View style={s.container}>
      <View style={s.avatar}>
        <Text style={s.avatarTxt}>{(client.first_name||"?")[0]}{(client.last_name||"")[0]}</Text>
      </View>
      <Text style={s.name}>{client.first_name} {client.last_name}</Text>
      {client.company&&<Text style={s.sub}>{client.company}</Text>}
      <Text style={s.email}>{client.email}</Text>

      <View style={s.actions}>
        <TouchableOpacity style={s.action} onPress={call}>
          <Text style={s.actionIcon}>📞</Text>
          <Text style={s.actionLbl}>Appeler</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.action} onPress={mail}>
          <Text style={s.actionIcon}>✉</Text>
          <Text style={s.actionLbl}>Email</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.action} onPress={maps}>
          <Text style={s.actionIcon}>🗺</Text>
          <Text style={s.actionLbl}>Itinéraire</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
const s=StyleSheet.create({
  container:{flex:1,backgroundColor:"#fff",padding:24,alignItems:"center"},
  avatar:{width:72,height:72,borderRadius:36,backgroundColor:"#E6F1FB",justifyContent:"center",alignItems:"center",marginBottom:12},
  avatarTxt:{fontSize:24,fontWeight:"700",color:"#185FA5"},
  name:{fontSize:20,fontWeight:"700",marginBottom:4},
  sub:{fontSize:14,color:"#666",marginBottom:2},
  email:{fontSize:14,color:"#185FA5",marginBottom:24},
  actions:{flexDirection:"row",gap:16},
  action:{alignItems:"center",backgroundColor:"#f5f5f5",borderRadius:12,padding:16,minWidth:80},
  actionIcon:{fontSize:24,marginBottom:4},
  actionLbl:{fontSize:13,fontWeight:"500"}
})