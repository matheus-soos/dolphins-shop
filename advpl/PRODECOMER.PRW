#include 'protheus.ch'
#INCLUDE 'totvs.ch'
#INCLUDE "restful.ch"
#include 'topconn.ch'

/*/{Protheus.doc} PCIClienteOrdemServico
    Planejamento Controle Implantao Cliente
    @type  Function
    @author Sergio Celestino
/*/

WsRestFul ProdEcomer Description "Método responsável pela exportação dos produtos do E-commerce"

	WsData FILIAL AS String OPTIONAL

	WsMethod GET GetProdutos Description "GetProdutos" WsSyntax "/getProdutos" PATH 'getProdutos' PRODUCES APPLICATION_JSON
	WsMethod GET GetCategorias Description "GetCategorias" WsSyntax "/getCategorias" PATH 'getCategorias' PRODUCES APPLICATION_JSON
	WsMethod POST SyncSaldo Description "SyncSaldo" WsSyntax "/syncSaldo" PATH 'syncSaldo' PRODUCES APPLICATION_JSON

End WsRestFul

WsMethod Get GetProdutos WsReceive FILIAL WsService ProdEcomer

	Local cTmp      := GetNextAlias()

	//Tabela ACU
	//Tabela ACV

	cQry := ""
	cQry += "SELECT B1_COD, B1_FILIAL, B1_DESC, B1_GRUPO, B1_POSIPI, B1_PRV1, B1_PESO, B1_ESTSEG, B1_CODBAR, B1_MODELO,"
	cQry += "B1_FABRIC, B1_RASTRO, B1_LOCALIZ, B5_COMPR, B5_ECALTEM, B5_LARG, B5_ECPESOE, B5_ESPESS, B5_ECFLAG,"
	cQry += "ISNULL(SB2.B2_QATU, 0) AS B2_QATU,"
	cQry += "ISNULL(SB2.B2_RESERVA, 0) AS B2_RESERVA"
	cQry += "FROM " + RetSqlName("SB1") + " SB1 "
	cQry += "LEFT JOIN " + RetSqlName("SB5") + " SB5 ON B1_COD = B5_COD AND SB5.B5_FILIAL = '44' AND SB5.D_E_L_E_T_ = ' ' "
	cQry += "LEFT JOIN " + RetSqlName("SB2") + " SB2 ON B1_COD = B2_COD AND SB2.B2_FILIAL = '44' AND SB2.D_E_L_E_T_ = ' ' "
	cQry += "WHERE SB1.D_E_L_E_T_ = ' ' AND SB1.B1_FILIAL = '44' AND B5_ECFLAG = '1' "
	cQry += "ORDER BY SB1.B1_COD "

	Conout(cQry)

	cQry := ChangeQuery(cQry)

	DbUseArea(.T., "TOPCONN", TCGENQRY(,,cQry), cTmp, .F., .T.)

	cJson := '{"produtos": ['

	(cTmp)->(dbGotop())

	While (cTmp)->(!Eof())
		Conout("B2_QATU: " + Str((cTmp)->B2_QATU) + ", B2_RESERVA: " + Str((cTmp)->B2_RESERVA))
		cJson += '{'
		cJson += '"Produto":"'     	+ Alltrim((cTmp)->B1_COD)       		+ '",'
		cJson += '"Descricao":"'   	+ Alltrim((cTmp)->B1_DESC)      		+ '",'
		cJson += '"NCM":"'         	+ Alltrim((cTmp)->B1_POSIPI)    		+ '",'
		cJson += '"PrecoVenda":"'  	+ Alltrim(Str((cTmp)->B1_PRV1, 10, 2))   + '",'
		cJson += '"Peso":"'        	+ Alltrim(Str((cTmp)->B1_PESO, 10, 3))   + '",'
		cJson += '"EstoqueSeg":"'  	+ Alltrim(Str((cTmp)->B1_ESTSEG))        + '",'
		cJson += '"CodBarras":"'   	+ Alltrim((cTmp)->B1_CODBAR)    		+ '",'
		cJson += '"Modelo":"'      	+ Alltrim((cTmp)->B1_MODELO)    		+ '",'
		cJson += '"Fabricante":"'  	+ Alltrim((cTmp)->B1_FABRIC)    		+ '",'
		// cJson += '"Especificacao":"' + Alltrim((cTmp)->B5_ECDESCR) + '",'
		cJson += '"PesoEmbalagem":"' + Alltrim(Str((cTmp)->B5_ECPESOE,10,2))+ '",'
		cJson += '"Altura":"'      	+ Alltrim(Str((cTmp)->B5_ECALTEM,10,2)) + '",'
		cJson += '"Comprimento":"' 	+ Alltrim(Str((cTmp)->B5_COMPR,10,2))   + '",'
		cJson += '"Largura":"'     	+ Alltrim(Str((cTmp)->B5_LARG,10,2))  	+ '",'
		cJson += '"Espessura":"'   	+ Alltrim(Str((cTmp)->B5_ESPESS,10,2))  + '",'
		cJson += '"Grupo":"'   		+ Alltrim((cTmp)->B1_GRUPO)  			+ '",'
		cJson += '"Saldo":"'   		+ Alltrim(Str((cTmp)->B2_QATU,10,2))  	+ '",'
		cJson += '"Flag":"'        	+ Alltrim((cTmp)->B5_ECFLAG)    + '"'
		cJson += '},'

		(cTmp)->(dbSkip())
	End

	If Substr(cJson, Len(cJson), 1) == ','
		cJson := Substr(cJson, 1, Len(cJson) - 1)
	Endif

	cJson += ']}'

	::SetContentType("application/json")
	::SetResponse(cJson)

	(cTmp)->(dbCloseArea())

Return .T.

WsMethod Get GetCategorias WsReceive FILIAL WsService ProdEcomer

	Local __cFilial := ::FILIAL
	Local cTmp      := GetNextAlias()

	cQry := ""
	cQry += "SELECT BM_GRUPO, BM_DESC FROM " + RetSqlName("SBM") + " SBM WHERE BM_FILIAL = " + __cFilial + " AND SBM.D_E_L_E_T_ = ' '"

	Conout(cQry)

	cQry := ChangeQuery(cQry)

	DbUseArea(.T., "TOPCONN", TCGENQRY(,,cQry), cTmp, .F., .T.)

	cJson := '{"grupos": ['

	(cTmp)->(dbGotop())

	While (cTmp)->(!Eof())
		cJson += '{'
		cJson += '"Codigo":"' + Alltrim((cTmp)->BM_GRUPO) + '",'
		cJson += '"Nome":"' + Alltrim((cTmp)->BM_DESC) + '"'
		cJson += '},'

		(cTmp)->(dbSkip())
	End

	If Substr(cJson, Len(cJson), 1) == ','
		cJson := Substr(cJson, 1, Len(cJson) - 1)
	Endif

	cJson += ']}'

	::SetContentType("application/json")
	::SetResponse(cJson)

	(cTmp)->(dbCloseArea())

Return .T.

WsMethod POST SyncSaldo WsService ProdEcomer
	Local cTmp      := GetNextAlias()

	cQry := ""
	cQry += "SELECT B1_COD, B1_FILIAL, B1_DESC, B5_ECFLAG,"
	cQry += "ISNULL(SB2.B2_QATU, 0) AS B2_QATU,"
	cQry += "ISNULL(SB2.B2_RESERVA, 0) AS B2_RESERVA"
	cQry += "FROM " + RetSqlName("SB1") + " SB1 "
	cQry += "LEFT JOIN " + RetSqlName("SB2") + " SB2 ON B1_COD = B2_COD AND SB2.B2_FILIAL = '44' AND SB2.D_E_L_E_T_ = ' ' "
	cQry += "WHERE SB1.D_E_L_E_T_ = ' ' AND SB1.B1_FILIAL = '44' AND B5_ECFLAG = '1' "
	cQry += "ORDER BY SB1.B1_COD "

	cQry := ChangeQuery(cQry)

	DbUseArea(.T., "TOPCONN", TCGENQRY(,,cQry), cTmp, .F., .T.)

	cJson := '{"produtos": ['

	(cTmp)->(dbGotop())

	While (cTmp)->(!Eof())
		cJson += '{'
		cJson += '"Produto":"'     	+ Alltrim((cTmp)->B1_COD)       		+ '",'
		cJson += '"Descricao":"'   	+ Alltrim((cTmp)->B1_DESC)      		+ '",'
		cJson += '"Saldo":"'   		+ Alltrim(Str((cTmp)->B2_QATU,10,2))  	+ '",'
		cJson += '"Flag":"'        	+ Alltrim((cTmp)->B5_ECFLAG)    + '"'
		cJson += '},'

		(cTmp)->(dbSkip())
	End

	If Substr(cJson, Len(cJson), 1) == ','
		cJson := Substr(cJson, 1, Len(cJson) - 1)
	Endif

	cJson += ']}'

	::SetContentType("application/json")
	::SetResponse(cJson)

	(cTmp)->(dbCloseArea())
Return .T.
