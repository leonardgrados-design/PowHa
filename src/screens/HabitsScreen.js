import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, Alert } from "react-native";

export default function HomeScreen() {

const [xp,setXp] = useState(0);
const [nivel,setNivel] = useState(1);
const [modalVisible,setModalVisible] = useState(false);
const [habit,setHabit] = useState("");

function abrirHabit(nombre){
setHabit(nombre);
setModalVisible(true);
}

function completarHabit(){

let experiencia = 10;
let nuevaXP = xp + experiencia;
let nuevoNivel = nivel;

if(nuevaXP >= 100){
nuevaXP = nuevaXP - 100;
nuevoNivel = nivel + 1;

Alert.alert(
"¡SUBISTE DE NIVEL!",
"Ahora eres nivel " + nuevoNivel
);
}

setXp(nuevaXP);
setNivel(nuevoNivel);
setModalVisible(false);

Alert.alert(
"Buen trabajo 💪",
"Ganas " + experiencia + " XP"
);

}

return (

<View style={styles.container}>

<Text style={styles.titulo}>Hábitos Saludables</Text>

<View style={styles.cardNivel}>
<Text style={styles.nivel}>Nivel {nivel}</Text>

<View style={styles.barra}>
<View style={[styles.progreso,{width: `${xp}%`}]} />
</View>

<Text style={styles.xp}>{xp}/100 XP</Text>
</View>

<View style={styles.grid}>

<TouchableOpacity style={styles.circulo} onPress={()=>abrirHabit("Correr 2.3 km")}>
<Text style={styles.emoji}>🏃</Text>
<Text style={styles.texto}>Correr</Text>
</TouchableOpacity>

<TouchableOpacity style={styles.circulo} onPress={()=>abrirHabit("No fumar")}>
<Text style={styles.emoji}>🚭</Text>
<Text style={styles.texto}>No fumar</Text>
</TouchableOpacity>

<TouchableOpacity style={styles.circulo} onPress={()=>abrirHabit("Leer 10 min")}>
<Text style={styles.emoji}>📚</Text>
<Text style={styles.texto}>Leer</Text>
</TouchableOpacity>

<TouchableOpacity style={styles.circulo} onPress={()=>abrirHabit("Comer saludable")}>
<Text style={styles.emoji}>🥗</Text>
<Text style={styles.texto}>Comer sano</Text>
</TouchableOpacity>

<TouchableOpacity style={styles.circulo} onPress={()=>abrirHabit("Hilo dental")}>
<Text style={styles.emoji}>🦷</Text>
<Text style={styles.texto}>Hilo dental</Text>
</TouchableOpacity>

<TouchableOpacity style={styles.circulo} onPress={()=>abrirHabit("Pasear perro")}>
<Text style={styles.emoji}>🐕</Text>
<Text style={styles.texto}>Pasear perro</Text>
</TouchableOpacity>

</View>

<Modal
visible={modalVisible}
transparent={true}
animationType="fade"
>

<View style={styles.modalFondo}>

<View style={styles.modalCaja}>

<Text style={styles.modalTitulo}>{habit}</Text>

<Pressable style={styles.boton} onPress={completarHabit}>
<Text style={styles.textoBoton}>Completar hábito ✔</Text>
</Pressable>

<Pressable style={styles.cerrar} onPress={()=>setModalVisible(false)}>
<Text style={styles.textoCerrar}>Cerrar</Text>
</Pressable>

</View>

</View>

</Modal>

</View>

);
}

const styles = StyleSheet.create({

container:{
flex:1,
backgroundColor:"#ff6b4a",
alignItems:"center",
paddingTop:60
},

titulo:{
fontSize:30,
color:"white",
fontWeight:"bold",
marginBottom:15
},

cardNivel:{
backgroundColor:"white",
width:"85%",
borderRadius:15,
padding:15,
alignItems:"center",
shadowColor:"#000",
shadowOpacity:0.2,
shadowRadius:5,
elevation:5
},

nivel:{
fontSize:20,
fontWeight:"bold"
},

barra:{
width:"100%",
height:12,
backgroundColor:"#eee",
borderRadius:10,
marginTop:10
},

progreso:{
height:12,
backgroundColor:"#ff6b4a",
borderRadius:10
},

xp:{
marginTop:5,
color:"#555"
},

grid:{
flexDirection:"row",
flexWrap:"wrap",
justifyContent:"center",
marginTop:25
},

circulo:{
width:120,
height:120,
backgroundColor:"white",
borderRadius:60,
justifyContent:"center",
alignItems:"center",
margin:10,
shadowColor:"#000",
shadowOpacity:0.2,
shadowRadius:5,
elevation:5
},

emoji:{
fontSize:28
},

texto:{
marginTop:5,
fontWeight:"bold"
},

modalFondo:{
flex:1,
backgroundColor:"rgba(0,0,0,0.6)",
justifyContent:"center",
alignItems:"center"
},

modalCaja:{
backgroundColor:"white",
padding:25,
borderRadius:15,
width:"80%",
alignItems:"center"
},

modalTitulo:{
fontSize:22,
fontWeight:"bold",
marginBottom:20
},

boton:{
backgroundColor:"#ff6b4a",
padding:15,
borderRadius:10,
width:"100%",
alignItems:"center",
marginBottom:10
},

textoBoton:{
color:"white",
fontWeight:"bold"
},

cerrar:{
padding:10
},

textoCerrar:{
color:"gray"
}

});