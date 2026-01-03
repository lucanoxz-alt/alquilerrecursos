package com.turismo.alquilerrecursos.util;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;
import java.math.BigDecimal;

@Converter(autoApply = false)
public class IntDecimalConverter implements AttributeConverter<Integer, BigDecimal> {
    @Override
    public BigDecimal convertToDatabaseColumn(Integer attribute) {
        if (attribute == null) return null;
        return BigDecimal.valueOf(attribute);
    }

    @Override
    public Integer convertToEntityAttribute(BigDecimal dbData) {
        if (dbData == null) return null;
        return dbData.intValue();
    }
}
