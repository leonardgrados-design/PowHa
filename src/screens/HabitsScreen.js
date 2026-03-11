import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, Alert, TextInput } from "react-native";

export default function HomeScreen() {

const [xp,setXp] = useState(0);
const [nivel,setNivel] = useState(1);

const [modalVisible,setModalVisible] = useState(false);
const [crearVisible,setCrearVisible] = useState(false);

const [habit,setHabit] = useState("");

const [nuevoHabit,setNuevoHabit] = useState("");
const [iconoSeleccionado,setIconoSeleccionado] = useState("⭐");

const [habitos,setHabitos] = useState([
{nombre:"Correr 2 km",icono:"🏃",xp:10},
{nombre:"No fumar",icono:"🚭",xp:15},
{nombre:"Leer 10 min",icono:"📚",xp:12},
{nombre:"Comer saludable",icono:"🥗",xp:14},
{nombre:"Hilo dental",icono:"🦷",xp:8},
{nombre:"Pasear perro",icono:"🐕",xp:10},
]);

const iconos = ["🏃","📚","🥗","🧘","💧","🚴","🧠","🦷","🐕","⭐"];

function abrirHabit(nombre){
setHabit(nombre);
setModalVisible(true);
}

function completarHabit(){

let experiencia = Math.floor(Math.random()*20)+5;

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

function crearHabit(){

if(nuevoHabit === ""){
Alert.alert("Escribe un nombre para el hábito");
return;
}

let xpRandom = Math.floor(Math.random()*20)+5;

let nuevo = {
nombre:nuevoHabit,
icono:iconoSeleccionado,
xp:xpRandom
};

setHabitos([...habitos,nuevo]);

setNuevoHabit("");
setCrearVisible(false);

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


<TouchableOpacity
style={styles.botonCrear}
onPress={()=>setCrearVisible(true)}
>
<Text style={styles.textoBoton}>+ Crear hábito</Text>
</TouchableOpacity>


<View style={styles.grid}>

{habitos.map((h,index)=>(
<TouchableOpacity
key={index}
style={styles.circulo}
onPress={()=>abrirHabit(h.nombre)}
>

<Text style={styles.emoji}>{h.icono}</Text>
<Text style={styles.texto}>{h.nombre}</Text>

</TouchableOpacity>
))}

</View>


<Modal visible={modalVisible} transparent animationType="fade">

<View style={styles.modalFondo}>

<View style={styles.modalCaja}>

<Text style={styles.modalTitulo}>{habit}</Text>

<Pressable style={styles.boton} onPress={completarHabit}>
<Text style={styles.textoBoton}>Completar hábito ✔</Text>
</Pressable>

<Pressable onPress={()=>setModalVisible(false)}>
<Text style={styles.textoCerrar}>Cerrar</Text>
</Pressable>

</View>

</View>

</Modal>



<Modal visible={crearVisible} transparent animationType="slide">

<View style={styles.modalFondo}>

<View style={styles.modalCaja}>

<Text style={styles.modalTitulo}>Nuevo hábito</Text>

<TextInput
placeholder="Nombre del hábito"
style={styles.input}
value={nuevoHabit}
onChangeText={setNuevoHabit}
/>

<Text style={{marginBottom:10}}>Elige un icono</Text>

<View style={styles.iconosGrid}>

{iconos.map((icon,index)=>(
<TouchableOpacity
key={index}
onPress={()=>setIconoSeleccionado(icon)}
style={styles.iconoBtn}
>
<Text style={{fontSize:25}}>{icon}</Text>
</TouchableOpacity>
))}

</View>

<Pressable style={styles.boton} onPress={crearHabit}>
<Text style={styles.textoBoton}>Crear hábito</Text>
</Pressable>

<Pressable onPress={()=>setCrearVisible(false)}>
<Text style={styles.textoCerrar}>Cancelar</Text>
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
backgroundColor:"white",
alignItems:"center",
paddingTop:60
},

titulo:{
fontSize:30,
fontWeight:"bold",
marginBottom:15
},

cardNivel:{
backgroundColor:"#f3f3f3",
width:"85%",
borderRadius:15,
padding:15,
alignItems:"center"
},

nivel:{
fontSize:20,
fontWeight:"bold"
},

barra:{
width:"100%",
height:12,
backgroundColor:"#ddd",
borderRadius:10,
marginTop:10
},

progreso:{
height:12,
backgroundColor:"#4CAF50",
borderRadius:10
},

xp:{
marginTop:5,
color:"#555"
},

botonCrear:{
backgroundColor:"#4CAF50",
padding:12,
borderRadius:10,
marginTop:20
},

textoBoton:{
color:"white",
fontWeight:"bold"
},

grid:{
flexDirection:"row",
flexWrap:"wrap",
justifyContent:"center",
marginTop:20
},

circulo:{
width:110,
height:110,
backgroundColor:"#f9f9f9",
borderRadius:60,
justifyContent:"center",
alignItems:"center",
margin:10,
borderWidth:1,
borderColor:"#eee"
},

emoji:{
fontSize:28
},

texto:{
marginTop:5,
fontWeight:"bold",
textAlign:"center"
},

modalFondo:{
flex:1,
backgroundColor:"rgba(0,0,0,0.5)",
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
marginBottom:15
},

textoCerrar:{
color:"gray",
marginTop:10
},

input:{
borderWidth:1,
borderColor:"#ccc",
width:"100%",
padding:10,
borderRadius:10,
marginBottom:15
},

iconosGrid:{
flexDirection:"row",
flexWrap:"wrap",
justifyContent:"center",
marginBottom:15
},

iconoBtn:{
margin:8
}

});