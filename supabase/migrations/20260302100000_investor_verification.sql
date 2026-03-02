-- Trigger para marcar a los inversores como verificados cuando confirman su email
-- Este trigger observa cambios en auth.users y sincroniza con public.investors

CREATE OR REPLACE FUNCTION public.handle_investor_verification()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el email ha sido confirmado (email_confirmed_at deja de ser null)
  IF (NEW.email_confirmed_at IS NOT NULL AND (OLD.email_confirmed_at IS NULL OR OLD.email_confirmed_at IS NULL)) THEN
    UPDATE public.investors
    SET is_verified = true
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Borrar trigger si ya existe para evitar duplicados
DROP TRIGGER IF EXISTS on_investor_email_confirmed ON auth.users;

-- Crear el trigger en la tabla auth.users
CREATE TRIGGER on_investor_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_investor_verification();
