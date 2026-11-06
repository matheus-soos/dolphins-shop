-- =====================================================================
-- Ajustes e-commerce - 06/11/2026
-- Rodar no banco (PostgreSQL), com o backend parado.
-- O database.sync() cria tabelas novas (Produto_Imagens), mas NÃO altera
-- nem remove colunas de tabelas que já existem, por isso este script.
-- Pode ser rodado mais de uma vez (os passos verificam o estado atual).
-- Obs.: o Sequelize está com underscored: true, então o antigo imgPath = img_path.
-- =====================================================================

BEGIN;

-- 1) Data de nascimento: timestamp -> date (evita o dia "voltar" por fuso horário)
DO $$
BEGIN
    IF (SELECT data_type FROM information_schema.columns
         WHERE table_name = 'Clientes' AND column_name = 'data_nascimento') <> 'date' THEN
        ALTER TABLE "Clientes"
            ALTER COLUMN data_nascimento TYPE date
            USING (data_nascimento AT TIME ZONE 'America/Sao_Paulo')::date;
    END IF;
END $$;

-- 2) Descrição do produto: varchar(255) -> text (descrições longas do Protheus)
ALTER TABLE "Produtos"
    ALTER COLUMN descricao TYPE text;

-- 3) Galeria de imagens (o sync() também cria, deixo aqui para garantir)
CREATE TABLE IF NOT EXISTS "Produto_Imagens" (
    id          SERIAL PRIMARY KEY,
    produto_id  INTEGER NOT NULL REFERENCES "Produtos"(id) ON DELETE CASCADE,
    path        VARCHAR(255) NOT NULL,
    ordem       INTEGER NOT NULL DEFAULT 0,
    principal   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS produto_imagens_produto_id_idx ON "Produto_Imagens"(produto_id);

-- 4) Migra Produtos.img_path para a galeria e remove a coluna
--    (as imagens passam a ficar só em Produto_Imagens)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
                WHERE table_name = 'Produtos' AND column_name = 'img_path') THEN

        -- Corrige caminhos gravados com "\" (upload feito no Windows)
        UPDATE "Produtos"
           SET img_path = REPLACE(img_path, E'\\', '/')
         WHERE img_path LIKE E'%\\\\%';

        -- Imagem atual vira principal (se o produto ainda não tiver uma)
        INSERT INTO "Produto_Imagens" (produto_id, path, ordem, principal)
        SELECT p.id,
               p.img_path,
               0,
               NOT EXISTS (SELECT 1 FROM "Produto_Imagens" i2
                            WHERE i2.produto_id = p.id AND i2.principal)
          FROM "Produtos" p
         WHERE p.img_path IS NOT NULL
           AND NOT EXISTS (SELECT 1 FROM "Produto_Imagens" i
                            WHERE i.produto_id = p.id AND i.path = p.img_path);

        ALTER TABLE "Produtos" DROP COLUMN img_path;
    END IF;
END $$;

-- 5) Produto com imagens mas sem principal: promove a primeira
UPDATE "Produto_Imagens" i
   SET principal = TRUE
 WHERE i.id IN (
        SELECT DISTINCT ON (produto_id) id
          FROM "Produto_Imagens" x
         WHERE NOT EXISTS (SELECT 1 FROM "Produto_Imagens" y
                            WHERE y.produto_id = x.produto_id AND y.principal)
         ORDER BY produto_id, ordem, id);

-- 6) Garante no máximo UMA imagem principal por produto
CREATE UNIQUE INDEX IF NOT EXISTS produto_imagens_principal_uk
    ON "Produto_Imagens"(produto_id) WHERE principal;

COMMIT;
